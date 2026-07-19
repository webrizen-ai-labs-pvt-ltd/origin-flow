import { useCallback } from "react";
import {
  Slider as AriaSlider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  Label,
  type SliderProps as AriaSliderProps,
} from "react-aria-components";
import { cx, sortCx } from "../../../utils/cx";

export const styles = sortCx({
  common: {
    root: "flex w-full flex-col gap-2",
    labelRow: "flex items-center justify-between",
    label: "text-sm font-medium text-secondary",
    output: "text-sm tabular-nums text-tertiary",
    track: [
      "group/track relative h-1.5 w-full cursor-pointer rounded-full bg-quaternary",
      "disabled:cursor-not-allowed disabled:opacity-50",
    ].join(" "),
    fill: "absolute top-0 left-0 h-full rounded-full bg-brand-solid",
    thumb: [
      "top-1/2 size-5 -translate-y-1/2 cursor-grab rounded-full border-2 border-brand-solid bg-primary shadow-md outline-brand transition duration-100 ease-linear",
      "focus-visible:outline-2 focus-visible:outline-offset-2",
      "dragging:cursor-grabbing dragging:scale-110",
      "disabled:cursor-not-allowed",
    ].join(" "),
    tooltip: [
      "pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-primary-solid px-2.5 py-1 text-xs font-medium text-white shadow-lg",
      "opacity-0 transition-opacity duration-150",
      "group-focus-within/track:opacity-100 group-hover/track:opacity-100",
    ].join(" "),
  },
});

export interface SliderProps extends Omit<AriaSliderProps, "children"> {
  /** Label text displayed above the slider */
  label?: string;
  /** Whether to show the current value output */
  showOutput?: boolean;
  /** Whether to show a tooltip on hover/focus */
  showTooltip?: boolean;
  /** Format the displayed value */
  formatValue?: (value: number) => string;
  /** Custom class name */
  className?: string;
}

export function Slider({
  label,
  showOutput = true,
  showTooltip = false,
  formatValue,
  className,
  ...props
}: SliderProps) {
  const format = useCallback(
    (value: number) => (formatValue ? formatValue(value) : String(value)),
    [formatValue],
  );

  return (
    <AriaSlider
      {...props}
      className={cx(styles.common.root, className)}
    >
      {(label || showOutput) && (
        <div className={styles.common.labelRow}>
          {label && <Label className={styles.common.label}>{label}</Label>}
          {showOutput && (
            <SliderOutput className={styles.common.output}>
              {({ state }) =>
                state.values.length === 1
                  ? format(state.values[0])
                  : `${format(state.values[0])} – ${format(state.values[1])}`
              }
            </SliderOutput>
          )}
        </div>
      )}

      <SliderTrack className={styles.common.track}>
        {({ state }) => {
          const thumbCount = state.values.length;
          const isRange = thumbCount > 1;

          // Calculate fill position
          const fillLeft = isRange
            ? `${state.getThumbPercent(0) * 100}%`
            : "0%";
          const fillWidth = isRange
            ? `${(state.getThumbPercent(1) - state.getThumbPercent(0)) * 100}%`
            : `${state.getThumbPercent(0) * 100}%`;

          return (
            <>
              {/* Filled portion of the track */}
              <div
                className={styles.common.fill}
                style={{ left: fillLeft, width: fillWidth }}
              />

              {/* Render thumbs */}
              {state.values.map((_, i) => (
                <SliderThumb key={i} index={i} className={styles.common.thumb}>
                  {showTooltip && (
                    <div className={styles.common.tooltip}>
                      {format(state.values[i])}
                    </div>
                  )}
                </SliderThumb>
              ))}
            </>
          );
        }}
      </SliderTrack>
    </AriaSlider>
  );
}

/**
 * Range slider variant — convenience wrapper.
 */
export interface RangeSliderProps extends Omit<SliderProps, "defaultValue" | "value"> {
  /** Default range value */
  defaultValue?: [number, number];
  /** Controlled range value */
  value?: [number, number];
}

export function RangeSlider(props: RangeSliderProps) {
  return <Slider {...props} />;
}
