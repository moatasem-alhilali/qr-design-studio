import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface ToolProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Engaged state. Drives the pressed-in look via the `.tool` CSS contract. */
  on?: boolean;
  /** Lay the icon and label side by side instead of stacked. */
  wide?: boolean;
}

/**
 * The workshop's universal selector. A small machined tile that stands proud
 * of the bench and physically sinks when you engage it — the replacement for
 * every "border + tinted background" toggle in the previous build.
 */
export const Tool = forwardRef<HTMLButtonElement, ToolProps>(
  ({ on = false, wide = false, className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-on={on}
      aria-pressed={on}
      className={cn("tool", wide && "tool-wide", className)}
      {...props}
    >
      {children}
    </button>
  ),
);

Tool.displayName = "Tool";
