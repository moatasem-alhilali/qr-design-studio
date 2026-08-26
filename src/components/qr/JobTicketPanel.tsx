import { useRef, useState } from "react";
import { Download, Link2, Upload } from "lucide-react";
import { toast } from "sonner";

import type { QRConfig } from "@/lib/qr-engine";
import type { FrameConfig } from "@/lib/types";
import {
  buildShareUrl,
  designHasLogo,
  downloadDesignTicket,
  readDesignTicket,
} from "@/features/designer/services/design-file";
import type { DesignSnapshot } from "@/features/designer/hooks/useDesignerState";
import { Tool } from "@/components/workshop/Tool";
import { useI18n } from "@/shared/i18n/i18n";

interface JobTicketPanelProps {
  config: QRConfig;
  frame: FrameConfig;
  onLoad: (snapshot: DesignSnapshot) => void;
}

/**
 * The job ticket: the design as something you can keep, hand over, or send.
 * The studio autosaves as you work, so this covers the deliberate cases —
 * archiving a version, moving it to another machine, sending it to a client.
 */
export function JobTicketPanel({ config, frame, onLoad }: JobTicketPanelProps) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    const ticket = await readDesignTicket(file);
    if (!ticket) {
      toast.error(t.home.ticketInvalid);
      return;
    }
    onLoad({ config: ticket.config, frame: ticket.frame });
    toast.success(t.home.ticketLoaded);
  };

  const handleCopyLink = async () => {
    const url = buildShareUrl(config, frame);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t.home.linkCopied);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; show the URL so it can still be copied.
      window.prompt(t.home.copyLink, url);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Tool wide onClick={() => downloadDesignTicket(config, frame)}>
          <Download className="h-4 w-4" />
          {t.home.saveTicket}
        </Tool>
        <Tool wide onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" />
          {t.home.loadTicket}
        </Tool>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          void handleImport(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <Tool wide className="w-full" on={copied} onClick={handleCopyLink}>
        <Link2 className="h-4 w-4" />
        {copied ? t.home.linkCopied : t.home.copyLink}
      </Tool>

      {designHasLogo(config) && (
        <p className="text-[11px] leading-snug text-ink-faint">{t.home.linkDropsLogo}</p>
      )}
    </div>
  );
}
