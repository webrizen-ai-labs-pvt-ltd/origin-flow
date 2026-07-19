import type { FC, ReactNode } from "react";
import { isValidElement, useCallback, useRef, useState } from "react";
import {
  Button as AriaButton,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  type Key,
  type SelectProps,
} from "react-aria-components";
import { cx, sortCx } from "../../../utils/cx";
import { isReactComponent } from "../../../utils/is-react-component";
import { ChevronDown, Check } from "lucide-react";

export const styles = sortCx({
  common: {
    trigger: [
      "group relative inline-flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm text-primary shadow-xs ring-1 ring-primary ring-inset transition duration-100 ease-linear",
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
    icon: "pointer-events-none size-5 shrink-0 text-fg-quaternary transition-inherit-all",
    checkIcon: "ml-auto size-4 shrink-0 text-fg-brand-secondary opacity-0 group-selected/item:opacity-100 transition-opacity",
  },
  sizes: {
    sm: {
      trigger: "px-3 py-2 text-sm",
    },
    md: {
      trigger: "px-3.5 py-2.5 text-sm",
    },
    lg: {
      trigger: "px-4 py-3 text-md",
    },
  },
});

export interface DropdownOption {
  /** Unique key for the option */
  id: string | number;
  /** Display label */
  label: string;
  /** Optional description text */
  description?: string;
  /** Whether the option is disabled */
  isDisabled?: boolean;
  /** Optional icon component */
  icon?: FC<{ className?: string }> | ReactNode;
}

export interface DropdownProps<T extends object = DropdownOption> extends Omit<SelectProps<T>, "children"> {
  /** The list of options to display */
  options: DropdownOption[];
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Label text displayed above the dropdown */
  label?: string;
  /** Helper text displayed below the dropdown */
  helperText?: string;
  /** Error message displayed below the dropdown */
  errorMessage?: string;
  /** Size variant */
  size?: keyof typeof styles.sizes;
  /** Icon component or element to show before the selected value */
  iconLeading?: FC<{ className?: string }> | ReactNode;
  /** Custom class names */
  className?: string;
}

export function Dropdown({
  options,
  placeholder = "Select an option",
  label,
  helperText,
  errorMessage,
  size = "md",
  iconLeading: IconLeading,
  className,
  ...props
}: DropdownProps) {
  return (
    <Select {...props} className={cx("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-secondary">{label}</label>
      )}

      <AriaButton
        className={cx(
          styles.common.trigger,
          styles.sizes[size].trigger,
          errorMessage && "ring-error_subtle",
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {isValidElement(IconLeading) && IconLeading}
          {isReactComponent(IconLeading) && (() => {
            const Comp = IconLeading as FC<{ className?: string }>;
            return <Comp className={styles.common.icon} />;
          })()}
          <SelectValue className="truncate placeholder-shown:text-placeholder">
            {({ selectedText }) => selectedText || placeholder}
          </SelectValue>
        </span>
        <ChevronDown className={cx(styles.common.icon, "size-4 transition-transform group-open:rotate-180")} />
      </AriaButton>

      <Popover className={styles.common.popover} offset={4}>
        <ListBox className={styles.common.listbox} items={options}>
          {(item: DropdownOption) => (
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
                    return <Comp className={cx(styles.common.icon, "size-4")} />;
                  })()}
                </>
              )}
              <span className="flex-1 truncate">{item.label}</span>
              {item.description && (
                <span className="text-xs text-tertiary">{item.description}</span>
              )}
              <Check className={styles.common.checkIcon} />
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>

      {helperText && !errorMessage && (
        <p className="text-sm text-tertiary">{helperText}</p>
      )}
      {errorMessage && (
        <p className="text-sm text-error-primary">{errorMessage}</p>
      )}
    </Select>
  );
}

/**
 * Controlled dropdown hook for convenience.
 */
export function useDropdown(defaultKey?: Key) {
  const [selectedKey, setSelectedKey] = useState<Key | null>(defaultKey ?? null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const reset = useCallback(() => setSelectedKey(null), []);

  return { selectedKey, onSelectionChange: setSelectedKey, reset, triggerRef } as const;
}
