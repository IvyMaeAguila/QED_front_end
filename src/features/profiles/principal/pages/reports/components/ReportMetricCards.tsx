interface ReportMetricCardsProps {
  items: { label: string; value: string; detail: string }[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function ReportMetricCards({ items, panelBg, panelBorder, textPrimary, textMuted }: ReportMetricCardsProps) {
  return (
    <section aria-label="Report highlights" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item, index) => (
        <article
          key={item.label}
          className={`min-w-0 rounded-xl border px-4 py-3.5 ${panelBg} ${panelBorder}`}
          style={index === 0 ? { borderColor: "var(--color-maroon)", borderTopWidth: 2 } : undefined}
        >
          <p className="text-xs font-semibold text-maroon">{item.label}</p>
          <p className={`mt-1.5 truncate text-xl font-bold tabular-nums ${textPrimary}`} title={item.value}>{item.value}</p>
          <p className={`mt-1 truncate text-xs ${textMuted}`} title={item.detail}>{item.detail}</p>
        </article>
      ))}
    </section>
  );
}
