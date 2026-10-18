import { Lightbulb } from "lucide-react";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import type { ExaminationAnalytics } from "../services/reports.service";
import { examinationInsights } from "../utils/examinationInsights";

interface Props {
  data?: ExaminationAnalytics;
  loading: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}
export function ExaminationInsights({ data, loading, panelBg, panelBorder, textPrimary, textMuted }: Props) {
  return <section aria-label="Examination Insights" className={`rounded-xl border p-4 ${panelBg} ${panelBorder}`}>
    <h3 className={`flex items-center gap-2 text-sm font-semibold ${textPrimary}`}><Lightbulb size={15} aria-hidden="true" />Examination Insights</h3>
    <LoadingRegion loading={loading} skeleton={<p className={`mt-2 text-xs ${textMuted}`}>Loading examination insights...</p>}>
      <div className="mt-2 flex flex-col gap-2">
        {examinationInsights(data).map((insight, index) => <div key={`${insight.title}:${insight.text}`} className={index ? `border-t pt-2 ${panelBorder}` : ""}>
          <p className={`text-xs font-semibold ${textPrimary}`}>{insight.title}</p>
          <p className={`mt-1 text-xs leading-relaxed ${textMuted}`}>{insight.text}</p>
        </div>)}
        {!!data?.summary.count && <p className={`text-xs ${textMuted}`}>Observations describe recorded results only, including valid partial results.</p>}
      </div>
    </LoadingRegion>
  </section>;
}
