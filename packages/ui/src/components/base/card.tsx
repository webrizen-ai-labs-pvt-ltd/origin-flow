import type { ReactNode } from "react";
import { cx } from "../../utils/cx";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-xl border border-secondary bg-primary p-6 shadow-sm",
        className
      )}
    >
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-primary">{title}</h3>
      )}
      {children}
    </div>
  );
}
