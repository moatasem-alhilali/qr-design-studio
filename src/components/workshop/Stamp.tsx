import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface StampProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Solid black rubber instead of the red outline. */
  solid?: boolean;
}

/**
 * A rubber stamp. Used for the actions that commit something to the world —
 * exporting a file, applying a template. It sits slightly crooked, lifts when
 * you reach for it, and thuds flat with a full ink hit when pressed.
 */
export const Stamp = forwardRef<HTMLButtonElement, StampProps>(
  ({ solid = false, className, children, ...props }, ref) => (
    <button ref={ref} type="button" className={cn("stamp", solid && "stamp-ink", className)} {...props}>
      {children}
    </button>
  ),
);

Stamp.displayName = "Stamp";
