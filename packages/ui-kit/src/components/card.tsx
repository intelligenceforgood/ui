import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};

export function Card({ className, padded = true, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-100 bg-white/80 backdrop-blur shadow-sm transition hover:shadow-md",
        padded && "p-6",
        className,
      )}
      {...props}
    />
  );
}
