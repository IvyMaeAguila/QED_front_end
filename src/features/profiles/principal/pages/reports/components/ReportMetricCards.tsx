import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
interface ReportMetricCardsProps {
  loading?: boolean;
  view?: string;
  items: { label: string; value: string; detail: string; detailKnown?: boolean }[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function ReportMetricCards({ items, loading = false, view = "report", panelBg, panelBorder, textPrimary, textMuted }: ReportMetricCardsProps) {
  return (
    <section aria-label="Report highlights" className="grid grid-cols-2 gap-3 xl:grid-cols-4" data-sk-region="reportmetriccards-section-field-1">
      {items.map((item, index) => (
        <article
          key={item.label}
          className={`min-w-0 rounded-xl border px-4 py-3.5 ${panelBg} ${panelBorder}`}
          style={index === 0 ? { borderColor: "var(--color-maroon)", borderTopWidth: 2 } : undefined}
        >
          <p className="text-xs font-semibold text-maroon">{item.label}</p>
          <p className={`mt-1.5 truncate text-xl font-bold tabular-nums ${textPrimary}`} title={loading ? undefined : item.value} data-sk-region={`report-metric-value-${index}`}><LoadingRegion as="span" className="w-full" loading={loading} skeleton={<SkeletonText width={["2ch", "4ch", "65%", "58%"][index % 4]} />}>{item.value}</LoadingRegion></p>
          <p className={`mt-1 truncate text-xs ${textMuted}`} title={loading && !item.detailKnown ? undefined : item.detail} data-sk-region={`report-metric-detail-${index}`}>{item.detailKnown ? item.detail : <LoadingRegion as="span" className="w-full" name={`${view}:metric-detail-${index}`} loading={loading} skeleton={<SkeletonText width={index % 2 ? "62%" : "78%"} />}>{item.detail}</LoadingRegion>}</p>
        </article>
      ))}
    </section>
  );
}
