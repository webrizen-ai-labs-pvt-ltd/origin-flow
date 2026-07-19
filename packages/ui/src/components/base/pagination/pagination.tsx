import { useCallback, useMemo, useState } from "react";
import { cx, sortCx } from "../../../utils/cx";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const styles = sortCx({
  common: {
    root: "flex items-center justify-between gap-2",
    nav: "flex items-center gap-1",
    pageButton: [
      "inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-secondary transition duration-100 ease-linear",
      "outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
      "hover:bg-primary_hover hover:text-secondary",
      "disabled:cursor-not-allowed disabled:opacity-50",
    ].join(" "),
    activePageButton: "bg-primary_hover text-primary font-semibold",
    arrowButton: [
      "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-secondary transition duration-100 ease-linear",
      "outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
      "hover:bg-primary_hover",
      "disabled:cursor-not-allowed disabled:opacity-50",
    ].join(" "),
    ellipsis: "inline-flex size-10 items-center justify-center text-sm text-tertiary",
    summary: "text-sm text-tertiary",
  },
});

export interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Called when page changes */
  onPageChange: (page: number) => void;
  /** Number of sibling pages to show on each side of the current page */
  siblingCount?: number;
  /** Show Previous/Next text labels */
  showLabels?: boolean;
  /** Custom class name */
  className?: string;
}

function range(start: number, end: number): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
}

function usePaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): (number | "ellipsis")[] {
  return useMemo(() => {
    // Total page buttons we want to show (sibling left + current + sibling right + 2 boundaries)
    const totalPageNumbers = siblingCount * 2 + 5;

    // Case 1: If total pages is small enough to show all
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = leftSibling > 2;
    const showRightEllipsis = rightSibling < totalPages - 1;

    // Case 2: No left ellipsis but right ellipsis
    if (!showLeftEllipsis && showRightEllipsis) {
      const leftRange = range(1, 3 + 2 * siblingCount);
      return [...leftRange, "ellipsis" as const, totalPages];
    }

    // Case 3: Left ellipsis but no right ellipsis
    if (showLeftEllipsis && !showRightEllipsis) {
      const rightRange = range(totalPages - (2 + 2 * siblingCount), totalPages);
      return [1, "ellipsis" as const, ...rightRange];
    }

    // Case 4: Both ellipses
    const middleRange = range(leftSibling, rightSibling);
    return [1, "ellipsis" as const, ...middleRange, "ellipsis" as const, totalPages];
  }, [currentPage, totalPages, siblingCount]);
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showLabels = true,
  className,
}: PaginationProps) {
  const pages = usePaginationRange(currentPage, totalPages, siblingCount);

  const goToPrevious = useCallback(() => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const goToNext = useCallback(() => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  }, [currentPage, totalPages, onPageChange]);

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cx(styles.common.root, className)}>
      {/* Previous */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={goToPrevious}
        className={styles.common.arrowButton}
        aria-label="Go to previous page"
      >
        <ArrowLeft className="size-4" />
        {showLabels && <span>Previous</span>}
      </button>

      {/* Page numbers */}
      <div className={styles.common.nav}>
        {pages.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <span key={`ellipsis-${index}`} className={styles.common.ellipsis}>
                …
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cx(
                styles.common.pageButton,
                isActive && styles.common.activePageButton,
              )}
              aria-label={`Page ${page}`}
              aria-current={isActive ? "page" : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={goToNext}
        className={styles.common.arrowButton}
        aria-label="Go to next page"
      >
        {showLabels && <span>Next</span>}
        <ArrowRight className="size-4" />
      </button>
    </nav>
  );
}

/**
 * Convenience hook for pagination state.
 */
export function usePagination(totalItems: number, itemsPerPage: number) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    onPageChange: goToPage,
  };
}
