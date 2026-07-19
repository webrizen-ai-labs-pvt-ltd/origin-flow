import type { ReactNode } from "react";
import { cx, sortCx } from "../../../utils/cx";

export const styles = sortCx({
  common: {
    root: "flex items-center gap-2",
    line: "h-px flex-1 bg-secondary",
    content: "shrink-0 text-sm text-tertiary",
  },
  variants: {
    fullWidth: {
      root: "",
      line: "",
    },
    withLabel: {
      root: "",
      line: "",
    },
  },
});

type DividerOrientation = "horizontal" | "vertical";

export interface ContentDividerProps {
  /** Text or element rendered in the center of the divider */
  children?: ReactNode;
  /** Orientation of the divider */
  orientation?: DividerOrientation;
  /** Custom class name */
  className?: string;
  /** Custom class name for the line segments */
  lineClassName?: string;
}

export function ContentDivider({
  children,
  orientation = "horizontal",
  className,
  lineClassName,
}: ContentDividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cx("mx-2 h-full w-px self-stretch bg-secondary", className)}
      />
    );
  }

  if (!children) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={cx("h-px w-full bg-secondary", className)}
      />
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cx(styles.common.root, className)}
    >
      <div className={cx(styles.common.line, lineClassName)} />
      <div className={styles.common.content}>{children}</div>
      <div className={cx(styles.common.line, lineClassName)} />
    </div>
  );
}
