import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { BarcodeConfig, defaultBarcodeConfig } from "@/lib/barcode-engine";
import { QRConfig, defaultConfig } from "@/lib/qr-engine";
import { defaultFrameConfig, FrameConfig } from "@/lib/types";
import { qrTemplates } from "@/lib/qr-templates";
import {
  loadDesignLocally,
  readShareParam,
  saveDesignLocally,
  type DesignTicket,
} from "@/features/designer/services/design-file";

export type DesignType = "qr" | "barcode";

/** One undoable snapshot of the QR side of the studio. */
export interface DesignSnapshot {
  config: QRConfig;
  frame: FrameConfig;
}

const HISTORY_LIMIT = 60;
const AUTOSAVE_DELAY_MS = 500;
/** Edits closer together than this fold into the previous history entry. */
const COALESCE_MS = 400;

interface HistoryState {
  past: DesignSnapshot[];
  present: DesignSnapshot;
  future: DesignSnapshot[];
  lastEditAt: number;
}

type HistoryAction =
  | { type: "patchConfig"; updates: Partial<QRConfig>; at: number }
  | { type: "setConfig"; config: QRConfig; at: number }
  | { type: "setFrame"; frame: FrameConfig; at: number }
  | { type: "replace"; snapshot: DesignSnapshot; at: number }
  | { type: "undo" }
  | { type: "redo" };

/**
 * Records `next` as the current design.
 *
 * `coalesce` is what makes undo usable: dragging the size dial fires dozens of
 * updates, and without folding them together a single undo would step back one
 * pixel at a time instead of to the design you had before the drag.
 */
function push(state: HistoryState, next: DesignSnapshot, at: number, coalesce: boolean): HistoryState {
  const shouldFold = coalesce && at - state.lastEditAt < COALESCE_MS;
  return {
    past: shouldFold ? state.past : [...state.past, state.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
    lastEditAt: at,
  };
}

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case "patchConfig":
      return push(
        state,
        { ...state.present, config: { ...state.present.config, ...action.updates } },
        action.at,
        true,
      );

    case "setConfig":
      // Applying a preset or template is one deliberate act, never folded.
      return push(state, { ...state.present, config: action.config }, action.at, false);

    case "setFrame":
      return push(state, { ...state.present, frame: action.frame }, action.at, true);

    case "replace":
      return push(state, action.snapshot, action.at, false);

    case "undo": {
      if (!state.past.length) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future].slice(0, HISTORY_LIMIT),
        lastEditAt: 0,
      };
    }

    case "redo": {
      if (!state.future.length) return state;
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: state.future[0],
        future: state.future.slice(1),
        lastEditAt: 0,
      };
    }

    default:
      return state;
  }
}

/**
 * Decides what the studio opens with, in priority order: a shared link, then a
 * requested template, then whatever was last being worked on. A link or a
 * template is an explicit instruction, so it outranks the autosave.
 */
function resolveInitialSnapshot(): { snapshot: DesignSnapshot; fromTemplate: boolean; fromShare: boolean } {
  const fallback = { snapshot: { config: defaultConfig, frame: defaultFrameConfig }, fromTemplate: false, fromShare: false };
  if (typeof window === "undefined") return fallback;

  const shared = readShareParam(window.location.search);
  if (shared) {
    return { snapshot: { config: shared.config, frame: shared.frame }, fromTemplate: false, fromShare: true };
  }

  const templateId = new URLSearchParams(window.location.search).get("template");
  if (templateId) {
    const template = qrTemplates.find((item) => item.id === templateId);
    if (template) {
      return {
        snapshot: {
          config: { ...defaultConfig, ...template.config, dataType: template.dataType, data: "" },
          frame: template.suggestedFrame
            ? { ...defaultFrameConfig, type: "simple", textBottom: template.suggestedFrame }
            : defaultFrameConfig,
        },
        fromTemplate: true,
        fromShare: false,
      };
    }
  }

  const saved: DesignTicket | null = loadDesignLocally();
  if (saved) return { snapshot: { config: saved.config, frame: saved.frame }, fromTemplate: false, fromShare: false };

  return fallback;
}

export function useDesignerState() {
  const [designType, setDesignType] = useState<DesignType>("qr");
  const [barcodeConfig, setBarcodeConfig] = useState<BarcodeConfig>(defaultBarcodeConfig);

  const initial = useRef(resolveInitialSnapshot()).current;
  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initial.snapshot,
    future: [],
    lastEditAt: 0,
  });

  const { config, frame } = history.present;

  const handleChange = useCallback((updates: Partial<QRConfig>) => {
    dispatch({ type: "patchConfig", updates, at: Date.now() });
  }, []);

  const handleFullChange = useCallback((newConfig: QRConfig) => {
    dispatch({ type: "setConfig", config: newConfig, at: Date.now() });
  }, []);

  const setFrameConfig = useCallback((nextFrame: FrameConfig) => {
    dispatch({ type: "setFrame", frame: nextFrame, at: Date.now() });
  }, []);

  const replaceDesign = useCallback((snapshot: DesignSnapshot) => {
    dispatch({ type: "replace", snapshot, at: Date.now() });
  }, []);

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  // The shortcuts anyone expects from a design tool.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;

      const target = event.target as HTMLElement | null;
      // Text fields keep their own native undo stack.
      if (target && (/^(INPUT|TEXTAREA)$/.test(target.tagName) || target.isContentEditable)) return;

      event.preventDefault();
      if (key === "y" || event.shiftKey) redo();
      else undo();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);

  // Autosave, debounced so a dial drag does not hammer localStorage.
  useEffect(() => {
    const timer = window.setTimeout(() => saveDesignLocally(config, frame), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [config, frame]);

  const handleBarcodeChange = useCallback((updates: Partial<BarcodeConfig>) => {
    setBarcodeConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleFullBarcodeChange = useCallback((newConfig: BarcodeConfig) => {
    setBarcodeConfig(newConfig);
  }, []);

  return useMemo(
    () => ({
      designType,
      config,
      barcodeConfig,
      frameConfig: frame,
      setDesignType,
      setFrameConfig,
      handleChange,
      handleFullChange,
      handleBarcodeChange,
      handleFullBarcodeChange,
      replaceDesign,
      undo,
      redo,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      openedFromTemplate: initial.fromTemplate,
      openedFromShare: initial.fromShare,
    }),
    [
      barcodeConfig,
      config,
      designType,
      frame,
      handleBarcodeChange,
      handleChange,
      handleFullBarcodeChange,
      handleFullChange,
      history.future.length,
      history.past.length,
      initial.fromShare,
      initial.fromTemplate,
      redo,
      replaceDesign,
      setFrameConfig,
      undo,
    ],
  );
}
