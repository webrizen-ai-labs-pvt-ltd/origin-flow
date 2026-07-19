import type { FC, ReactNode } from "react";
import { isValidElement, useCallback, useMemo, useRef, useState } from "react";
import {
  Button as AriaButton,
  ListBox,
  ListBoxItem,
  Popover,
  DialogTrigger,
  Dialog,
  type Selection,
} from "react-aria-components";
import { cx, sortCx } from "../../../utils/cx";
import { isReactComponent } from "../../../utils/is-react-component";
import { ChevronDown, Check, X } from "lucide-react";

export const styles = sortCx({
  common: {
    trigger: [
      "group relative inline-flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary shadow-xs ring-1 ring-primary ring-inset transition duration-100 ease-linear",
      "outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
      "hover:bg-primary_hover",
      "disabled:cursor-not-allowed disabled:opacity-50",
    ].join(" "),
    popover: [
      "w-[var(--trigger-width)] overflow-hidden rounded-lg border border-secondary bg-primary shadow-lg",
      "entering:animate-in entering:fade-in-0 entering:zoom-in-95",
      "exiting:animate-out exiting:fade-out-0 exiting:zoom-out-95",
    ].join(" "),
    listbox: "max-h-60 overflow-y-auto p-1 outline-hidden",
    item: [
      "group/item relative flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-secondary outline-hidden transition duration-100 ease-linear",
      "hover:bg-primary_hover",
      "focus:bg-primary_hover",
      "selected:text-primary selected:font-medium",
      "disabled:cursor-not-allowed disabled:opacity-50",
    ].join(" "),
    tag: "inline-flex items-center gap-1 rounded-md bg-quaternary px-2 py-0.5 text-xs font-medium text-secondary",
    tagRemove: [
      "inline-flex size-3.5 cursor-pointer items-center justify-center rounded transition duration-100 ease-linear",
      "hover:bg-error-primary hover:text-white",
    ].join(" "),
    checkIcon: "ml-auto size-4 shrink-0 text-fg-brand-secondary opacity-0 group-selected/item:opacity-100 transition-opacity",
  },
});

export interface MultiSelectOption {
  /** Unique key for the option */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon component */
  icon?: FC<{ className?: string }> | ReactNode;
  /** Whether the option is disabled */
  isDisabled?: boolean;
}

export interface MultiSelectProps {
  /** The list of options to display */
  options: MultiSelectOption[];
  /** Currently selected keys (controlled) */
  selectedKeys?: Set<string>;
  /** Default selected keys (uncontrolled) */
  defaultSelectedKeys?: Set<string>;
  /** Called when selection changes */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Label text displayed above the control */
  label?: string;
  /** Helper text displayed below the control */
  helperText?: string;
  /** Error message displayed below the control */
  errorMessage?: string;
  /** Maximum number of tags to show before collapsing */
  maxVisibleTags?: number;
  /** Whether the component is disabled */
  isDisabled?: boolean;
  /** Custom class names */
  className?: string;
}

export function MultiSelect({
  options,
  selectedKeys: controlledKeys,
  defaultSelectedKeys,
  onSelectionChange,
  placeholder = "Select options",
  label,
  helperText,
  errorMessage,
  maxVisibleTags = 3,
  isDisabled = false,
  className,
}: MultiSelectProps) {
  const [internalKeys, setInternalKeys] = useState<Set<string>>(defaultSelectedKeys ?? new Set());
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = controlledKeys ?? internalKeys;

  const handleSelectionChange = useCallback(
    (selection: Selection) => {
      if (selection === "all") return;
      const keys = new Set(Array.from(selection).map(String));
      if (!controlledKeys) setInternalKeys(keys);
      onSelectionChange?.(keys);
    },
    [controlledKeys, onSelectionChange],
  );

  const removeTag = useCallback(
    (key: string) => {
      const next = new Set(selected);
      next.delete(key);
      if (!controlledKeys) setInternalKeys(next);
      onSelectionChange?.(next);
    },
    [selected, controlledKeys, onSelectionChange],
  );

  const selectedOptions = useMemo(
    () => options.filter((o) => selected.has(o.id)),
    [options, selected],
  );

  const visibleTags = selectedOptions.slice(0, maxVisibleTags);
  const overflowCount = selectedOptions.length - maxVisibleTags;

  return (
    <DialogTrigger>
      <div className={cx("flex flex-col gap-1.5", className)}>
        {label && (
          <label className="text-sm font-medium text-secondary">{label}</label>
        )}

        <AriaButton
          ref={triggerRef}
          isDisabled={isDisabled}
          className={cx(
            styles.common.trigger,
            "min-h-[42px] flex-wrap",
            errorMessage && "ring-error_subtle",
          )}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-placeholder">{placeholder}</span>
          ) : (
            <span className="flex flex-1 flex-wrap items-center gap-1">
              {visibleTags.map((opt) => (
                <span key={opt.id} className={styles.common.tag}>
                  {opt.label}
                  <span
                    role="button"
                    tabIndex={-1}
                    className={styles.common.tagRemove}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(opt.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        removeTag(opt.id);
                      }
                    }}
                    aria-label={`Remove ${opt.label}`}
                  >
                    <X className="size-3" />
                  </span>
                </span>
              ))}
              {overflowCount > 0 && (
                <span className={styles.common.tag}>+{overflowCount}</span>
              )}
            </span>
          )}
          <ChevronDown className="size-4 shrink-0 text-fg-quaternary transition-transform group-open:rotate-180" />
        </AriaButton>

        <Popover className={styles.common.popover} offset={4}>
          <Dialog className="outline-hidden">
            <ListBox
              className={styles.common.listbox}
              items={options}
              selectionMode="multiple"
              selectedKeys={selected}
              onSelectionChange={handleSelectionChange}
            >
              {(item: MultiSelectOption) => (
                <ListBoxItem
                  key={item.id}
                  id={item.id}
                  textValue={item.label}
                  isDisabled={item.isDisabled}
                  className={styles.common.item}
                >
                  {item.icon && (
                    <>
                      {isValidElement(item.icon) && item.icon}
                      {isReactComponent(item.icon) && (() => {
                        const Comp = item.icon as FC<{ className?: string }>;
                        return <Comp className="size-4 shrink-0 text-fg-quaternary" />;
                      })()}
                    </>
                  )}
                  <span className="flex-1 truncate">{item.label}</span>
                  <Check className={styles.common.checkIcon} />
                </ListBoxItem>
              )}
            </ListBox>
          </Dialog>
        </Popover>

        {helperText && !errorMessage && (
          <p className="text-sm text-tertiary">{helperText}</p>
        )}
        {errorMessage && (
          <p className="text-sm text-error-primary">{errorMessage}</p>
        )}
      </div>
    </DialogTrigger>
  );
}
