import {
  Button as AriaButton,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Popover,
  type DatePickerProps as AriaDatePickerProps,
  type DateValue,
} from "react-aria-components";
import { cx, sortCx } from "../../../utils/cx";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export const styles = sortCx({
  common: {
    root: "flex flex-col gap-1.5",
    group: [
      "group relative flex w-full items-center rounded-lg bg-primary px-3.5 py-2.5 shadow-xs ring-1 ring-primary ring-inset transition duration-100 ease-linear",
      "outline-brand focus-within:outline-2 focus-within:outline-offset-2",
      "hover:bg-primary_hover",
      "disabled:cursor-not-allowed disabled:opacity-50",
    ].join(" "),
    dateInput: "flex flex-1 items-center text-sm text-primary",
    segment: [
      "rounded px-0.5 tabular-nums outline-hidden transition duration-100 ease-linear",
      "focus:bg-brand-solid focus:text-white",
      "placeholder-shown:text-placeholder",
      "type-literal:text-tertiary",
    ].join(" "),
    calendarButton: [
      "flex size-8 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear",
      "text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover",
      "outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
    ].join(" "),
    popover: [
      "overflow-hidden rounded-xl border border-secondary bg-primary p-4 shadow-lg",
      "entering:animate-in entering:fade-in-0 entering:zoom-in-95",
      "exiting:animate-out exiting:fade-out-0 exiting:zoom-out-95",
    ].join(" "),
    calendarHeader: "mb-4 flex items-center justify-between",
    calendarHeading: "text-sm font-semibold text-primary",
    calendarNavButton: [
      "flex size-8 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear",
      "text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover",
      "outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
    ].join(" "),
    calendarGrid: "w-full border-collapse",
    calendarHeaderCell: "pb-2 text-xs font-medium text-tertiary",
    calendarCell: [
      "flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm transition duration-100 ease-linear",
      "text-secondary hover:bg-primary_hover",
      "focus-visible:outline-2 focus-visible:outline-offset-2 outline-brand",
      "outside-month:text-quaternary",
      "selected:bg-brand-solid selected:text-white selected:font-medium",
      "today:font-semibold today:text-brand-secondary",
      "disabled:cursor-not-allowed disabled:opacity-30",
    ].join(" "),
  },
});

export interface DatePickerProps<T extends DateValue> extends Omit<AriaDatePickerProps<T>, "children"> {
  /** Label text displayed above the date picker */
  label?: string;
  /** Helper text displayed below the date picker */
  helperText?: string;
  /** Error message displayed below the date picker */
  errorMessage?: string;
  /** Custom class name */
  className?: string;
}

export function DatePicker<T extends DateValue>({
  label,
  helperText,
  errorMessage,
  className,
  ...props
}: DatePickerProps<T>) {
  return (
    <AriaDatePicker {...props} className={cx(styles.common.root, className)}>
      {label && (
        <label className="text-sm font-medium text-secondary">{label}</label>
      )}

      <Group className={cx(styles.common.group, errorMessage && "ring-error_subtle")}>
        <DateInput className={styles.common.dateInput}>
          {(segment) => (
            <DateSegment segment={segment} className={styles.common.segment} />
          )}
        </DateInput>
        <AriaButton className={styles.common.calendarButton}>
          <CalendarIcon className="size-5" />
        </AriaButton>
      </Group>

      <Popover className={styles.common.popover} offset={4}>
        <Dialog className="outline-hidden">
          <Calendar>
            <header className={styles.common.calendarHeader}>
              <AriaButton slot="previous" className={styles.common.calendarNavButton}>
                <ChevronLeft className="size-4" />
              </AriaButton>
              <Heading className={styles.common.calendarHeading} />
              <AriaButton slot="next" className={styles.common.calendarNavButton}>
                <ChevronRight className="size-4" />
              </AriaButton>
            </header>

            <CalendarGrid className={styles.common.calendarGrid}>
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className={styles.common.calendarHeaderCell}>
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell date={date} className={styles.common.calendarCell} />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>

      {helperText && !errorMessage && (
        <p className="text-sm text-tertiary">{helperText}</p>
      )}
      {errorMessage && (
        <p className="text-sm text-error-primary">{errorMessage}</p>
      )}
    </AriaDatePicker>
  );
}
