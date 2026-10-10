import { SkeletonText } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { skeletonRows } from "@shared/loading/reservations";
import { useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { useSnapshotTheme } from "../context/SnapshotThemeContext";
import type {
  ChartDomainKey,
  HistoryEntry,
  ScoreBand,
  SubjectHolisticSnapshot,
  WholeChildSnapshotData,
} from "../types/types";
import type { DetailStudent } from "../../GlobalTypes/types";

const DOMAIN_META: Record<ChartDomainKey, { label: string; color: string }> = {
  cognitive: { label: "Cognitive", color: "var(--chart-cognitive)" },
  emotional: { label: "Emotional", color: "var(--chart-emotional)" },
  behavioral: { label: "Behavioral", color: "var(--chart-behavioral)" },
  social: { label: "Social", color: "var(--chart-social)" },
};

const BANDS = [
  { from: 4.5, to: 5.001, remark: "Excellent", color: "#22C55E" },
  { from: 3.5, to: 4.5, remark: "Good", color: "#34D399" },
  { from: 2.5, to: 3.5, remark: "Average", color: "#F59E0B" },
  { from: 1.5, to: 2.5, remark: "Needs Improvement", color: "#FB923C" },
  { from: 1.0, to: 1.5, remark: "Critical", color: "#EF4444" },
] as const;

const DOMAIN_INTERPRETATIONS: Record<ChartDomainKey, Record<ScoreBand, string>> = {
  cognitive: {
    5: "Consistently understands and applies concepts independently",
    4: "Understands most concepts with minimal guidance",
    3: "Understands basic concepts but needs support",
    2: "Struggles to understand lessons",
    1: "Cannot demonstrate understanding",
  },
  emotional: {
    5: "Highly motivated and confident",
    4: "Generally positive and engaged",
    3: "Sometimes disengaged or unsure",
    2: "Frequently unmotivated",
    1: "Shows a negative attitude toward learning",
  },
  behavioral: {
    5: "Consistently follows rules and stays focused",
    4: "Generally disciplined with minor issues",
    3: "Sometimes distracted",
    2: "Frequently disruptive",
    1: "Behavior regularly needs support",
  },
  social: {
    5: "Actively collaborates and leads",
    4: "Works well with peers",
    3: "Participates occasionally",
    2: "Rarely interacts with peers",
    1: "Needs support participating with others",
  },
};

const DOMAIN_KEYS = Object.keys(DOMAIN_META) as ChartDomainKey[];
type SelectedPeriod = "current" | "previous";

function evaluationFor(value: number) {
  return BANDS.find((band) => value >= band.from && value < band.to) ?? BANDS[2];
}

function averageDomains(averages: WholeChildSnapshotData["domainAverages"]) {
  const values = DOMAIN_KEYS.map((domain) => averages[domain]).filter(
    (value): value is number => value !== null,
  );
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function interpretationFor(domain: ChartDomainKey, value: number) {
  const rounded = Math.min(5, Math.max(1, Math.round(value))) as ScoreBand;
  return DOMAIN_INTERPRETATIONS[domain][rounded];
}

function RatingBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const rating = evaluationFor(score);
  return (
    <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" style={{ color: rating.color, backgroundColor: `color-mix(in srgb, ${rating.color} 9.41%, transparent)` }}>
      {rating.remark}
    </span>
  );
}

export interface WholeChildSnapshotProps extends WholeChildSnapshotData {
  student?: DetailStudent;
  loading?: boolean; viewKey?: string;
  termKey?: string | number;
  history?: HistoryEntry[];
  subjects?: SubjectHolisticSnapshot[];
  title?: string;
  subtitle?: string;
  emptyStateScope?: string;
  recommendations?: { priority: "High" | "Medium"; message: string }[];
}

export function WholeChildSnapshot({
  loading = false, viewKey = "parent-weekly",
  termKey,
  history = [],
  subjects = [],
  title = "Whole-Child Snapshot",
  subtitle = "Overall ratings pooled across subjects, with the latest holistic ratings for each subject below.",
  domainAverages,
  evaluationCount,
  lastEvaluation,
}: WholeChildSnapshotProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useSnapshotTheme();
  const [selected, setSelected] = useState<SelectedPeriod>("current");

  useEffect(() => setSelected("current"), [termKey]);

  const shownSubjects = loading ? Array.from({length:skeletonRows(viewKey)},(_,id)=>({subjectSectionId:id,subjectName:"",current:{domainAverages:{cognitive:null,emotional:null,behavioral:null,social:null},evaluationCount:0,lastEvaluation:null}})) : subjects;
  const previousEntry = history[0] ?? null;
  const isCurrent = selected === "current";
  const displayedAverages = isCurrent ? domainAverages : previousEntry?.domainAverages ?? domainAverages;
  const displayedDate = isCurrent ? lastEvaluation : previousEntry?.date ?? previousEntry?.label ?? lastEvaluation;
  const overallScore = averageDomains(displayedAverages);
  const overallRating = overallScore === null ? null : evaluationFor(overallScore);

  return (
    <section className={`overflow-hidden rounded-xl2 border shadow-sm ${panelBg} ${panelBorder}`}>
      <header className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${panelBorder}`}>
        <div>
          <h2 className={`font-bold ${textPrimary}`}>{title}</h2>
          {subtitle && <p className={`mt-0.5 text-xs ${textMuted}`}>{subtitle}</p>}
        </div>
      </header>

      {(evaluationCount > 0 || history.length > 0) && (
        <div className={`flex flex-wrap items-center gap-2 border-b px-5 py-3 ${panelBorder}`}>
          <p className={`mr-auto text-xs font-medium ${textMuted}`}>
            {isCurrent ? "Viewing latest" : "Viewing previous"}{displayedDate ? ` · ${displayedDate}` : ""}
          </p>
          {previousEntry && (
            <div className={`qed-segmented-control flex items-center gap-0 rounded-lg p-0 ${darkMode ? "bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" : "bg-gray-50 shadow-[inset_0_0_0_1px_#e5e7eb]"}`}>
              <button type="button" onClick={() => setSelected("current")} aria-pressed={isCurrent}
                className={`rounded-lg px-3 text-xs font-bold ${isCurrent ? "bg-maroon text-white" : textMuted}`}>
                Latest
              </button>
              <button type="button" onClick={() => setSelected("previous")} aria-pressed={!isCurrent}
                className={`rounded-lg px-3 text-xs font-bold ${!isCurrent ? "bg-maroon text-white" : textMuted}`}>
                Previous{previousEntry.date ?? previousEntry.label ? ` · ${previousEntry.date ?? previousEntry.label}` : ""}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(190px,0.72fr)_minmax(0,1.28fr)]">
          <div className={`flex min-h-[210px] flex-col items-center justify-center rounded-xl2 border px-4 py-5 text-center ${darkMode ? "border-[#374151] bg-[#111827]" : "border-gray-200 bg-gray-50"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>Overall holistic rating</p>
            {loading ? <p className="mt-4 text-3xl font-bold"><SkeletonParagraph field={viewKey+":overall"} typical={2} width="10ch" /></p> : overallScore === null ? (
              <p className={`mt-4 text-sm font-medium ${textMuted}`}>No ratings yet</p>
            ) : (
              <>
                {overallRating && (
                  <p className="mt-4 text-3xl font-bold text-brand-ink">
                    {overallRating.remark}
                  </p>
                )}
                <p className={`mt-2 text-xs ${textMuted}`}>{evaluationCount} evaluations across subjects</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DOMAIN_KEYS.map((domain) => {
              const value = displayedAverages[domain];
              return (
                <article key={domain} className={`flex min-w-0 flex-col gap-2 rounded-xl2 border p-3 ${panelBorder} ${darkMode ? "bg-[#111827]" : "bg-white"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold" style={{ color: DOMAIN_META[domain].color }}>{DOMAIN_META[domain].label}</span>
                    {loading ? <SkeletonText width="7ch" /> : <RatingBadge score={value} />}
                  </div>
                  {loading ? <p className={`text-xs leading-relaxed ${textMuted}`}><SkeletonParagraph field={viewKey+":"+domain} typical={2} width="100%" /></p> : value === null ? (
                    <p className={`text-xs ${textMuted}`}>No rating yet</p>
                  ) : (
                    <p className={`text-xs leading-relaxed ${textMuted}`}><span data-sk-field={viewKey+":"+domain}>{interpretationFor(domain, value)}</span></p>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        {shownSubjects.length > 0 && (
          <div className={`mt-6 border-t pt-5 ${panelBorder}`}>
            <div className="mb-3">
              <h3 className={`text-sm font-bold ${textPrimary}`}>Holistic by Subject</h3>
              <p className={`mt-0.5 text-xs ${textMuted}`}>Latest ratings for each subject, with a subject average across available domains.</p>
            </div>
            <div className={`overflow-hidden rounded-xl2 border ${panelBorder} ${darkMode ? "bg-[#111827]" : "bg-white"}`}>
              <div className={`hidden grid-cols-[minmax(0,1.4fr)_minmax(110px,0.8fr)_repeat(4,minmax(90px,1fr))] items-center gap-3 border-b px-4 py-3 md:grid ${panelBorder} ${darkMode ? "bg-white/[0.04]" : "bg-gray-50"}`}>
                <span className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>Subject</span>
                <span className={`text-center text-xs font-bold uppercase tracking-wide ${textMuted}`}>Overall</span>
                {DOMAIN_KEYS.map((domain) => (
                  <span key={domain} className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>{DOMAIN_META[domain].label}</span>
                ))}
              </div>
              {shownSubjects.map((subject, index) => {
                const score = averageDomains(subject.current.domainAverages);
                const overallRating = score === null ? null : evaluationFor(score);
                return (
                  <article
                    key={subject.subjectSectionId}
                    className={`grid grid-cols-2 items-center gap-x-4 gap-y-3 px-4 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(110px,0.8fr)_repeat(4,minmax(90px,1fr))] md:gap-3 ${index < shownSubjects.length - 1 ? `border-b ${panelBorder}` : ""}`}
                  >
                    <div className="col-span-2 min-w-0 md:col-span-1">
                      <h4 className={`break-words text-sm font-semibold leading-snug ${textPrimary}`}>{loading ? <SkeletonParagraph field={viewKey+":subject:"+subject.subjectSectionId} typical={2} width="100%" /> : <span data-sk-field={viewKey+":subject:"+subject.subjectSectionId}>{subject.subjectName}</span>}</h4>
                      <p className={`mt-1 text-xs ${textMuted}`}>
                        {loading ? <SkeletonText width="15ch" /> : subject.current.evaluationCount > 0
                          ? `${subject.current.evaluationCount} ratings${subject.current.lastEvaluation ? ` · ${subject.current.lastEvaluation}` : ""}`
                          : "No ratings recorded yet"}
                      </p>
                    </div>

                    <div className="min-w-0 text-center">
                      <p className={`mb-1 text-xs font-bold uppercase tracking-wide text-gray-500 md:hidden`}>Overall</p>
                      {loading ? <SkeletonText width="9ch" /> : score === null ? (
                        <span className={`text-sm ${textMuted}`}>—</span>
                      ) : (
                        <p className="text-sm font-bold text-brand-ink">{overallRating?.remark}</p>
                      )}
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-3 md:contents">
                      {DOMAIN_KEYS.map((domain) => {
                        const value = subject.current.domainAverages[domain];
                        const rating = value === null ? null : evaluationFor(value);
                        return (
                          <div key={domain} className="min-w-0">
                            <p className={`mb-1 text-xs font-bold uppercase tracking-wide text-gray-500 md:hidden`}>{DOMAIN_META[domain].label}</p>
                            <p className="text-xs font-semibold tabular-nums" style={{ color: rating ? "var(--color-maroon)" : "#9CA3AF" }}>
                              {loading ? <SkeletonParagraph field={viewKey+":rating:"+subject.subjectSectionId+":"+domain} typical={2} width="100%" /> : value === null ? "—" : rating?.remark}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
