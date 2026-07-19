import type { FC, ReactNode } from "react";
import { isValidElement, Fragment } from "react";
import { Link as AriaLink, type LinkProps as AriaLinkProps } from "react-aria-components";
import { cx, sortCx } from "../../../utils/cx";
import { isReactComponent } from "../../../utils/is-react-component";
import { ChevronRight, Home } from "lucide-react";

export const styles = sortCx({
  common: {
    nav: "flex items-center",
    list: "flex items-center gap-1",
    item: "flex items-center gap-1",
    link: [
      "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-tertiary transition duration-100 ease-linear",
      "outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
      "hover:bg-primary_hover hover:text-secondary",
      "current:text-brand-secondary",
    ].join(" "),
    separator: "size-4 shrink-0 text-fg-quaternary",
    icon: "pointer-events-none size-4 shrink-0",
  },
  sizes: {
    sm: {
      link: "px-1.5 py-0.5 text-xs",
    },
    md: {
      link: "px-2 py-1 text-sm",
    },
    lg: {
      link: "px-2.5 py-1.5 text-sm",
    },
  },
});

export interface BreadcrumbItem {
  /** Unique key for the breadcrumb */
  id: string;
  /** Display label */
  label: string;
  /** Navigation URL */
  href?: string;
  /** Optional icon component or element */
  icon?: FC<{ className?: string }> | ReactNode;
  /** Whether this is the current page */
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  /** The list of breadcrumb items */
  items: BreadcrumbItem[];
  /** Size variant */
  size?: keyof typeof styles.sizes;
  /** Custom separator component or element */
  separator?: FC<{ className?: string }> | ReactNode;
  /** Show home icon on the first item */
  showHomeIcon?: boolean;
  /** Custom link props to pass to each breadcrumb link */
  linkProps?: Partial<AriaLinkProps>;
  /** Custom class name */
  className?: string;
}

export function Breadcrumbs({
  items,
  size = "md",
  separator,
  showHomeIcon = false,
  linkProps,
  className,
}: BreadcrumbsProps) {
  const renderSeparator = () => {
    if (separator) {
      if (isValidElement(separator)) return separator;
      if (isReactComponent(separator)) {
        const Comp = separator as FC<{ className?: string }>;
        return <Comp className={styles.common.separator} />;
      }
    }
    return <ChevronRight className={styles.common.separator} aria-hidden="true" />;
  };

  return (
    <nav aria-label="Breadcrumb" className={cx(styles.common.nav, className)}>
      <ol className={styles.common.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.isCurrent ?? isLast;
          const isFirst = index === 0;

          return (
            <Fragment key={item.id}>
              {index > 0 && (
                <li aria-hidden="true" className="flex items-center">
                  {renderSeparator()}
                </li>
              )}
              <li className={styles.common.item}>
                <AriaLink
                  href={isCurrent ? undefined : item.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cx(
                    styles.common.link,
                    styles.sizes[size].link,
                    isCurrent && "pointer-events-none text-brand-secondary font-semibold",
                  )}
                  {...linkProps}
                >
                  {/* Home icon on first item */}
                  {isFirst && showHomeIcon && (
                    <Home className={styles.common.icon} aria-hidden="true" />
                  )}

                  {/* Custom icon */}
                  {item.icon && (
                    <>
                      {isValidElement(item.icon) && item.icon}
                      {isReactComponent(item.icon) && (() => {
                        const Comp = item.icon as FC<{ className?: string }>;
                        return <Comp className={styles.common.icon} />;
                      })()}
                    </>
                  )}

                  {item.label}
                </AriaLink>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
