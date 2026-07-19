import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { cx, sortCx } from "../../../utils/cx";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Undo,
  Redo,
} from "lucide-react";

export const styles = sortCx({
  common: {
    root: "flex flex-col rounded-xl border border-secondary bg-primary shadow-xs overflow-hidden",
    toolbar: [
      "flex flex-wrap items-center gap-0.5 border-b border-secondary px-3 py-2",
    ].join(" "),
    toolbarGroup: "flex items-center gap-0.5",
    divider: "mx-1.5 h-5 w-px bg-quaternary",
    toolbarButton: [
      "inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear",
      "text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover",
      "focus-visible:outline-2 focus-visible:outline-offset-2 outline-brand",
      "data-[active=true]:bg-primary_hover data-[active=true]:text-fg-brand-secondary",
      "disabled:cursor-not-allowed disabled:opacity-50",
    ].join(" "),
    editor: "min-h-[120px] w-full resize-y px-3.5 py-3 text-sm text-primary outline-hidden placeholder:text-placeholder",
    footer: "flex items-center justify-between border-t border-secondary px-3.5 py-2",
    charCount: "text-xs text-tertiary",
  },
});

type FormatAction =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "unordered-list"
  | "ordered-list"
  | "align-left"
  | "align-center"
  | "align-right"
  | "link"
  | "undo"
  | "redo";

const formatIcons: Record<FormatAction, ReactNode> = {
  bold: <Bold className="size-4" />,
  italic: <Italic className="size-4" />,
  underline: <Underline className="size-4" />,
  strikethrough: <Strikethrough className="size-4" />,
  "unordered-list": <List className="size-4" />,
  "ordered-list": <ListOrdered className="size-4" />,
  "align-left": <AlignLeft className="size-4" />,
  "align-center": <AlignCenter className="size-4" />,
  "align-right": <AlignRight className="size-4" />,
  link: <Link className="size-4" />,
  undo: <Undo className="size-4" />,
  redo: <Redo className="size-4" />,
};

const formatLabels: Record<FormatAction, string> = {
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strikethrough: "Strikethrough",
  "unordered-list": "Bulleted list",
  "ordered-list": "Numbered list",
  "align-left": "Align left",
  "align-center": "Align center",
  "align-right": "Align right",
  link: "Insert link",
  undo: "Undo",
  redo: "Redo",
};

export interface TextEditorToolbarItem {
  action: FormatAction;
  isDisabled?: boolean;
}

export interface TextEditorToolbarGroup {
  items: TextEditorToolbarItem[];
}

const defaultToolbar: TextEditorToolbarGroup[] = [
  { items: [{ action: "bold" }, { action: "italic" }, { action: "underline" }, { action: "strikethrough" }] },
  { items: [{ action: "unordered-list" }, { action: "ordered-list" }] },
  { items: [{ action: "align-left" }, { action: "align-center" }, { action: "align-right" }] },
  { items: [{ action: "link" }] },
];

export interface TextEditorProps {
  /** The editor value (controlled) */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Called when the value changes */
  onChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label text displayed above the editor */
  label?: string;
  /** Helper text displayed below the editor */
  helperText?: string;
  /** Error message displayed below the editor */
  errorMessage?: string;
  /** Maximum character count (if set, shows counter) */
  maxLength?: number;
  /** Toolbar configuration. Pass `false` to hide the toolbar */
  toolbar?: TextEditorToolbarGroup[] | false;
  /** Active format actions */
  activeFormats?: Set<FormatAction>;
  /** Called when a toolbar action is clicked */
  onFormatAction?: (action: FormatAction) => void;
  /** Whether the editor is disabled */
  isDisabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Footer slot — rendered inside footer bar */
  footer?: ReactNode;
}

export function TextEditor({
  value: controlledValue,
  defaultValue = "",
  onChange,
  placeholder = "Type your message...",
  label,
  helperText,
  errorMessage,
  maxLength,
  toolbar = defaultToolbar,
  activeFormats = new Set(),
  onFormatAction,
  isDisabled = false,
  className,
  footer,
}: TextEditorProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = controlledValue ?? internalValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      if (maxLength && next.length > maxLength) return;
      if (controlledValue === undefined) setInternalValue(next);
      onChange?.(next);
    },
    [controlledValue, onChange, maxLength],
  );

  const charCount = currentValue.length;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-secondary">{label}</label>
      )}

      <div
        className={cx(
          styles.common.root,
          errorMessage && "border-error_subtle",
          isDisabled && "opacity-50",
        )}
      >
        {/* Toolbar */}
        {toolbar !== false && (
          <div className={styles.common.toolbar} role="toolbar" aria-label="Formatting options">
            {toolbar.map((group, gi) => (
              <div key={gi} className="contents">
                {gi > 0 && <div className={styles.common.divider} />}
                <div className={styles.common.toolbarGroup}>
                  {group.items.map((item) => (
                    <button
                      key={item.action}
                      type="button"
                      disabled={isDisabled || item.isDisabled}
                      data-active={activeFormats.has(item.action) || undefined}
                      className={styles.common.toolbarButton}
                      onClick={() => onFormatAction?.(item.action)}
                      aria-label={formatLabels[item.action]}
                      aria-pressed={activeFormats.has(item.action)}
                    >
                      {formatIcons[item.action]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Editor area */}
        <textarea
          value={currentValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={isDisabled}
          className={styles.common.editor}
          aria-label={label || "Text editor"}
          rows={4}
        />

        {/* Footer */}
        {(maxLength || footer) && (
          <div className={styles.common.footer}>
            <div>{footer}</div>
            {maxLength && (
              <span className={styles.common.charCount}>
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>

      {helperText && !errorMessage && (
        <p className="text-sm text-tertiary">{helperText}</p>
      )}
      {errorMessage && (
        <p className="text-sm text-error-primary">{errorMessage}</p>
      )}
    </div>
  );
}
