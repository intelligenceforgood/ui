import type { HTMLAttributes } from "react";
import { clsx } from "clsx";

export type SectionLabelProps = HTMLAttributes<HTMLElement> & {
  /** Render as a `<label>` instead of `<p>` when used above form controls. */
  as?: "p" | "label";
  /** The `htmlFor` attribute when rendered as a `<label>`. */
  htmlFor?: string;
};

/**
 * A small uppercase section heading used throughout the console UI.
 *
 * Replaces the repeated `text-xs font-semibold uppercase tracking-[0.2em]
 * text-slate-400` pattern (~33 occurrences).
 */
export function SectionLabel({
  as: Tag = "p",
  className,
  children,
  ...props
}: SectionLabelProps) {
  return (
    <Tag
      className={clsx(
        "text-xs font-semibold uppercase tracking-[0.2em] text-slate-400",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
