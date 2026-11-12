type EnrollmentBar = {
  key: string | number;
  label: string;
  shortLabel: string;
  value: number;
};

export function EnrollmentBars({ bars, label, darkMode, textMuted }: {
  bars: EnrollmentBar[];
  label: string;
  darkMode: boolean;
  textMuted: string;
}) {
  const peak = Math.max(1, ...bars.map(bar => bar.value));
  const magnitude = 10 ** Math.floor(Math.log10(peak / 4)) / 2;
  const interval = Math.ceil(peak / 4 / magnitude) * magnitude;
  const step = Math.max(1, Math.ceil(interval));
  const ceiling = step * 4;
  const ticks = [4, 3, 2, 1, 0].map(tick => tick * step);
  const gridColor = darkMode ? "border-[var(--color-grid-line-dark)]" : "border-[var(--color-grid-line)]";

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 pt-5"
        style={{ minWidth: `${2 + bars.length * 2.75}rem` }}>
        <div aria-hidden="true" className={`relative h-32 min-w-5 text-right text-xs tabular-nums ${textMuted}`}>
          <span className="invisible">{ceiling.toLocaleString()}</span>
          {ticks.map(value => (
            <span key={value} className="absolute right-0 translate-y-1/2"
              style={{ bottom: `${value / ceiling * 100}%` }}>{value.toLocaleString()}</span>
          ))}
        </div>
        <div className="relative">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-32">
            {ticks.map(value => (
              <div key={value} className={`absolute inset-x-0 border-t ${gridColor}`}
                style={{ bottom: `${value / ceiling * 100}%` }} />
            ))}
          </div>
          <ul aria-label={label} className="relative grid"
            style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}>
            {bars.map(bar => (
              <li key={bar.key} title={bar.label} className="min-w-0 text-center">
                <span className="sr-only">{bar.label}: </span>
                <div className="relative flex h-32 items-end justify-center px-1.5">
                  <div className="relative w-full max-w-9 rounded-t-md bg-[var(--chart-primary)]"
                    style={{ height: `${bar.value / ceiling * 100}%` }}>
                    <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-xs font-semibold tabular-nums">
                      {bar.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <span aria-hidden="true" className={`block pt-2 text-xs leading-tight ${textMuted}`}>{bar.shortLabel}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
