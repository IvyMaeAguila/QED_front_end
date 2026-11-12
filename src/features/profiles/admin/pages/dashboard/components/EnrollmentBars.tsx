type EnrollmentBar = {
  key: string | number;
  label: string;
  shortLabel: string;
  value: number;
};

export function EnrollmentBars({ bars, label, textMuted }: { bars: EnrollmentBar[]; label: string; textMuted: string }) {
  const peak = Math.max(1, ...bars.map(bar => bar.value));
  return (
    <div className="overflow-x-auto pb-1">
      <ul aria-label={label} className="grid" style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(3rem, 1fr))` }}>
        {bars.map(bar => (
          <li key={bar.key} title={bar.label} className="min-w-0 text-center">
            <span className="sr-only">{bar.label}: </span>
            <div className="flex h-24 flex-col justify-end gap-1 border-b border-current/15 px-1.5">
              <span className="text-xs font-semibold tabular-nums">{bar.value.toLocaleString()}</span>
              <div aria-hidden="true" className="mx-auto w-full max-w-10 rounded-t-md bg-[var(--chart-primary)]"
                style={{ height: `${bar.value / peak * 75}%` }} />
            </div>
            <span aria-hidden="true" className={`block pt-2 text-xs leading-tight ${textMuted}`}>{bar.shortLabel}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
