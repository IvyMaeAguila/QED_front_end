import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CalendarClock,
  ClipboardList,
  Heart,
  Shield,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useSnapshotTheme } from "../context/SnapshotThemeContext";
import type { ChartDomainKey, HistoryEntry, RiskLevel, ScoreBand, WholeChildSnapshotData } from "../types/types";
// Adjust this path to wherever DetailStudent actually lives relative to this file.
import type { DetailStudent } from "../../GlobalTypes/types";

const ACCENT = "#6B0000";

const BANDS = [
  { from: 1.0, to: 1.5, remark: "Critical", color: "#EF4444" },
  { from: 1.5, to: 2.5, remark: "Needs Improvement", color: "#FB923C" },
  { from: 2.5, to: 3.5, remark: "Average", color: "#F59E0B" },
  { from: 3.5, to: 4.5, remark: "Good", color: "#34D399" },
  { from: 4.5, to: 5.001, remark: "Excellent", color: "#22C55E" },
] as const;

const evaluationFor = (average: number) => {
  const band = BANDS.find((b) => average >= b.from && average < b.to) ?? BANDS[BANDS.length - 1];
  return { remark: band.remark, color: band.color };
};

const DOMAIN_META: Record<ChartDomainKey, { label: string; Icon: LucideIcon }> = {
  cognitive: { label: "Cognitive", Icon: Brain },
  emotional: { label: "Emotional", Icon: Heart },
  social: { label: "Social", Icon: Users },
  behavioral: { label: "Behavioral", Icon: Shield },
};

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
    1: "Shows negative attitude toward learning",
  },
  behavioral: {
    5: "Always follows rules and stays focused",
    4: "Minor issues but generally disciplined",
    3: "Sometimes distracted",
    2: "Frequently disruptive",
    1: "Consistently problematic behavior",
  },
  social: {
    5: "Actively collaborates and leads",
    4: "Works well with peers",
    3: "Participates occasionally",
    2: "Rarely interacts",
    1: "Avoids or disrupts group work",
  },
};

const interpretationFor = (domain: ChartDomainKey, value: number): string => {
  const rounded = Math.min(5, Math.max(1, Math.round(value))) as ScoreBand;
  return DOMAIN_INTERPRETATIONS[domain][rounded];
};

const RISK_BADGE: Record<RiskLevel, { label: string; color: string }> = {
  HIGH: { label: "High Risk", color: "#EF4444" },
  MEDIUM: { label: "Needs Attention", color: "#F59E0B" },
  NONE: { label: "No Risk", color: "#22C55E" },
};

function BandGauge({ value, textMuted }: { value: number | null; textMuted: string }) {
  if (value === null) {
    return <div className={`mt-3 h-1.5 w-full rounded-full ${textMuted} bg-current opacity-10`} />;
  }
  const min = 1;
  const max = 5;
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const markerColor = evaluationFor(value).color;

  return (
    <div className="relative mt-4 pb-1">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full">
        {BANDS.map((b, i) => (
          <div key={i} style={{ flexGrow: b.to - b.from, backgroundColor: b.color, opacity: 0.28 }} />
        ))}
      </div>
      <div
        className="absolute top-0 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white shadow-sm dark:border-neutral-900"
        style={{ left: `${pct}%`, backgroundColor: markerColor }}
      />
    </div>
  );
}

/** Internal shape used to drive whichever period (current or a past date) is on screen. */
type SelectedPeriod = "current" | number; // number = index into `history`

export interface WholeChildSnapshotProps extends WholeChildSnapshotData {
  /** The student this snapshot belongs to. Not yet used for rendering, but kept
   * for parity with sibling tab components (MissedActivities, InterventionSupport,
   * ClassSchedule) and for future use (e.g. personalized empty states, recommendations). */
  student?: DetailStudent;
  /** Identifies the current grading term/period (e.g. termNumber, or `${schoolYear}-${term}`).
   * Whenever this value changes, the date-button selection resets back to "Latest" — so
   * switching from Term 1 to Term 2 clears the old term's buttons/selection automatically.
   * Pass the new term's `history` alongside it. */
  termKey?: string | number;
  /** Past evaluation periods for the CURRENT term, most recent first. When provided (and
   * non-empty), a row of date buttons appears — clicking one swaps the card to that day's
   * evaluation. The current/latest evaluation is selected by default. */
  history?: HistoryEntry[];
  /** Card title. Defaults to "Whole-Child Snapshot". */
  title?: string;
  /** Subtitle under the title. Pass "" to hide it. */
  subtitle?: string;
  /** Label prefix for the risk badge, e.g. "Highest: ". */
  riskBadgePrefix?: string;
  /** What to call the subject/scope when there's no data yet (e.g. "student", "subject"). */
  emptyStateScope?: string;
  /** Optional recommended actions shown under the grid. Only shown for the current period. */
  recommendations?: { priority: "High" | "Medium"; message: string }[];
}

export function WholeChildSnapshot({
  student,
  termKey,
  history = [],
  title = "Whole-Child Snapshot",
  subtitle = "Pooled across every subject — open a subject tab for the actionable trend.",
  riskBadgePrefix = "Highest: ",
  emptyStateScope = "student",
  domainAverages,
  evaluationCount,
  lastEvaluation,
  riskLevel,
  recommendations = [],
}: WholeChildSnapshotProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useSnapshotTheme();
  const [selected, setSelected] = useState<SelectedPeriod>("current");

  // New term (or any change in termKey) → forget the old term's date-button selection
  // and jump back to viewing the latest evaluation.
  useEffect(() => {
    setSelected("current");
  }, [termKey]);

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;
  const subtleFill = darkMode ? "bg-white/5" : "bg-black/[0.03]";
  const subtleHover = darkMode ? "hover:bg-white/5" : "hover:bg-black/5";

  const isCurrent = selected === "current";
  const activeEntry = isCurrent ? null : history[selected as number] ?? null;

  // What actually gets rendered in the grid below — either the live snapshot or a past entry.
  const displayedAverages = activeEntry ? activeEntry.domainAverages : domainAverages;
  const displayedDateLabel = activeEntry ? activeEntry.date ?? activeEntry.label : lastEvaluation;

  return (
    <section className={cardClasses}>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${panelBorder}`}>
        <div>
          <h2 className={`font-extrabold ${textPrimary}`}>{title}</h2>
          {subtitle && <p className={`mt-0.5 text-[11px] font-semibold ${textMuted}`}>{subtitle}</p>}
        </div>
        {isCurrent && evaluationCount > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold"
            style={{ backgroundColor: `${RISK_BADGE[riskLevel].color}18`, color: RISK_BADGE[riskLevel].color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RISK_BADGE[riskLevel].color }} />
            {riskBadgePrefix}
            {RISK_BADGE[riskLevel].label}
          </span>
        )}
      </div>

      {evaluationCount > 0 && (
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-2 border-b px-5 py-3 ${panelBorder}`}>
          <span className={`mr-1 inline-flex items-center gap-1.5 text-xs font-semibold ${textMuted}`}>
            <CalendarClock size={13} />
            {isCurrent ? "Viewing latest" : "Viewing"}
            {displayedDateLabel ? ` · ${displayedDateLabel}` : ""}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelected("current")}
              aria-pressed={isCurrent}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isCurrent ? "text-white" : `${panelBorder} ${textMuted} ${subtleHover}`
              }`}
              style={{
                ...(isCurrent ? { background: ACCENT, borderColor: ACCENT } : {}),
                ["--tw-ring-color" as string]: ACCENT,
              }}
            >
              Latest
            </button>
            {history.map((entry, i) => {
              const active = selected === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-pressed={active}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    active ? "text-white" : `${panelBorder} ${textMuted} ${subtleHover}`
                  }`}
                  style={{
                    ...(active ? { background: ACCENT, borderColor: ACCENT } : {}),
                    ["--tw-ring-color" as string]: ACCENT,
                  }}
                >
                  {entry.date ?? entry.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-5">
        {evaluationCount === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <ClipboardList size={20} className={textMuted} />
            <p className={`text-sm font-semibold ${textPrimary}`}>No evaluations recorded yet.</p>
            <p className={`max-w-xs text-xs font-medium ${textMuted}`}>
              Weekly ratings entered for this {emptyStateScope} will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(DOMAIN_META) as ChartDomainKey[]).map((domain) => {
                const { label, Icon } = DOMAIN_META[domain];
                const value = displayedAverages[domain];
                const domainEval = value !== null ? evaluationFor(value) : null;
                return (
                  <div key={domain} className={`flex flex-col rounded-2xl border p-5 ${panelBorder}`}>
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: domainEval ? `${domainEval.color}18` : darkMode ? "#ffffff10" : "#F3F4F6",
                          color: domainEval ? domainEval.color : undefined,
                        }}
                      >
                        <Icon size={15} />
                      </span>
                      <p className={`text-[11px] font-bold uppercase tracking-wide ${textMuted}`}>{label}</p>
                    </div>

                    <p
                      className={`mt-3 text-lg font-black leading-tight ${domainEval ? "" : textPrimary}`}
                      style={domainEval ? { color: domainEval.color } : undefined}
                    >
                      {domainEval ? domainEval.remark : "No data"}
                    </p>
                    <p className={`text-xs font-bold ${textMuted}`}>{value !== null ? `${value.toFixed(1)} / 5.0` : ""}</p>

                    <BandGauge value={value} textMuted={textMuted} />

                    <div
                      className={`relative mt-3 overflow-hidden rounded-xl border-l-[3px] px-3 py-2.5 ${subtleFill}`}
                      style={{
                        borderColor: domainEval ? domainEval.color : darkMode ? "#ffffff20" : "#E5E7EB",
                      }}
                    >
                      <Sparkles
                        size={34}
                        className="pointer-events-none absolute -bottom-2 -right-2 opacity-[0.05]"
                        style={{ color: domainEval ? domainEval.color : textMuted }}
                      />
                      <div className="relative flex items-center gap-1">
                        <Sparkles size={11} style={{ color: domainEval ? domainEval.color : undefined }} className={domainEval ? "" : textMuted} />
                        <span
                          className="text-[10px] font-extrabold uppercase tracking-wider"
                          style={{ color: domainEval ? domainEval.color : undefined }}
                        >
                          {domainEval ? "Insight" : "Pending"}
                        </span>
                      </div>
                      <p className={`relative mt-1 text-[13px] font-bold leading-snug ${textPrimary}`}>
                        {domainEval && value !== null ? interpretationFor(domain, value) : "Awaiting evaluation data."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {isCurrent && recommendations.length > 0 && (
              <div className={`mt-6 space-y-2 border-t pt-5 ${panelBorder}`}>
                <p className={`text-xs font-extrabold uppercase tracking-wide ${textMuted}`}>Recommended actions</p>
                {recommendations.map((rec, i) => {
                  const color = rec.priority === "High" ? "#EF4444" : "#F59E0B";
                  return (
                    <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${panelBorder}`}>
                      <span className="mt-0.5 shrink-0" style={{ color }}>
                        <AlertTriangle size={15} />
                      </span>
                      <div>
                        <span
                          className="mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold align-middle"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          {rec.priority} priority
                        </span>
                        <span className={`text-sm font-medium ${textPrimary}`}>{rec.message}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}