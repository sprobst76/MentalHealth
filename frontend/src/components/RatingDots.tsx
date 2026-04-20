interface Props {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  label?: string;
}

export function RatingDots({ value, max = 5, onChange, label }: Props) {
  const readOnly = !onChange;
  return (
    <div
      role={readOnly ? "img" : "radiogroup"}
      aria-label={label ?? "Gewichtung"}
      className="inline-flex items-center gap-1"
    >
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const filled = n <= value;
        const common = "w-3 h-3 rounded-full border transition-colors";
        const styles = filled
          ? "bg-accent border-accent"
          : "bg-transparent border-line";
        if (readOnly) {
          return <span key={n} className={`${common} ${styles}`} />;
        }
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} von ${max}`}
            onClick={() => onChange?.(value === n ? n - 1 : n)}
            className={`${common} ${styles} hover:border-ink-soft`}
          />
        );
      })}
    </div>
  );
}
