import { Skeleton,SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingFormValue } from "@shared/loading/LoadingFormValue";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { lastKnownCount,rememberRows } from "@shared/loading/reservations";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import {
Activity,
Brain,
ChevronDown,
Compass,
Heart,
Minus,
Sparkles,
TrendingDown,
TrendingUp,
Users2,
} from "lucide-react";
import { useMemo,useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import {
CartesianGrid,
Line,
LineChart as RLineChart,
ReferenceArea,
ResponsiveContainer,
Tooltip,
XAxis,
YAxis,
} from "recharts";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { BackButton } from "../../../shared/components/DashboardUI";
import { AdvisorySectionTabs } from "../attendance/components/AdvisorySectionTabs";
import { useSelectedAdvisorySection } from "../attendance/services/useSelectedAdvisorySection.service";
import {
fetchGradingPeriodsGlobal,
type GradingPeriod,
} from "./services/holistic.service";
import {
fetchDomainTrendsOverview,
type DomainTrendsOverview,
type DomainWeekPoint,
} from "./services/holisticTrends.service";

// Matches --color-maroon in global.css. Kept as a literal hex (not var())
// so the `${ACCENT}xx` alpha-suffix trick used throughout this file still
// works — CSS custom properties can't have a hex alpha byte appended.
const ACCENT = "#8F1414";

// A single, on-brand neutral for icon blocks outside the chart itself.
// The four domains only need distinct hues where they're genuinely
// disambiguating something on screen at once — the multi-line chart and
// its legend. Repeating those same four hues on every scorecard and
// interpretation row on top of the green/gold/red status badges made the
// page feel busy, so this reuses the same brand maroon as everything
// else (not the near-black --color-maroon-black gradient stop, which
// read as too dark here).
const NEUTRAL_ICON = ACCENT;

const CHART_DOMAIN_META = {
  cognitive: { label: "Cognitive", tagline: "How well concepts are landing", color: "var(--chart-cognitive)", Icon: Brain },
  emotional: { label: "Emotional", tagline: "Motivation and confidence", color: "var(--chart-emotional)", Icon: Heart },
  behavioral: { label: "Behavioral", tagline: "Focus and classroom conduct", color: "var(--chart-behavioral)", Icon: Compass },
  social: { label: "Social", tagline: "Collaboration with peers", color: "var(--chart-social)", Icon: Users2 },
} as const;

type ChartDomainKey = keyof typeof CHART_DOMAIN_META;

// A genuine green -> gold -> red gradient, anchored to the app's own
// semantic tokens (--color-green / --color-gold / --color-red) at the
// Excellent / Average / Critical stops, with two transitional tones in
// between. Previously this jumped green -> blue -> brown -> pink -> red,
// which doesn't read as a "better to worse" scale, and "Average"
// (#B45309) was an exact hex collision with the Behavioral domain line.
const BANDS = [
  { from: 4.5, to: 5.0, label: "Excellent", color: "#3F8A5F" },
  { from: 3.5, to: 4.5, label: "Good", color: "#8FBF7A" },
  { from: 2.5, to: 3.5, label: "Average", color: "#C9A227" },
  { from: 1.5, to: 2.5, label: "Needs Improvement", color: "#D08A4F" },
  { from: 1.0, to: 1.5, label: "Critical", color: "#B5453F" },
];

function bandFor(value: number) {
  return BANDS.find((b) => value >= b.from && value <= b.to) ?? BANDS[2];
}

const DOMAIN_INTERPRETATIONS: Record<ChartDomainKey, Record<1 | 2 | 3 | 4 | 5, string>> = {
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

function interpretScore(domain: ChartDomainKey, value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.min(5, Math.max(1, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
  return DOMAIN_INTERPRETATIONS[domain][rounded];
}

function formatWeekTick(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatWeekLong(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return `Week of ${date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

// Now dark-mode aware — previously this hardcoded a white card and
// near-black text regardless of theme, so it broke as soon as the rest
// of the page switched to dark mode. Recharts merges any extra props you
// pass on the content element, so `darkMode` flows through from the
// chart's own Tooltip usage below.
function CustomTooltip({ active, payload, darkMode }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div
      className={`min-w-56 rounded-xl border px-3.5 py-2.5 shadow-card backdrop-blur-sm ${
        darkMode ? "border-white/10 bg-panel-dark/95" : "border-black/10 bg-white/95"
      }`}
    >
      <p className={`text-xs font-bold ${darkMode ? "text-white" : "text-[#111827]"}`}>{row.weekLabel}</p>
      <p className={`text-xs font-medium ${darkMode ? "text-white/50" : "text-[#8A8F98]"}`}>
        {formatWeekLong(row.weekStartDate)}
      </p>
      <div className="mt-2 space-y-2">
        {payload.map((entry: any) => {
          const domain = entry.dataKey as ChartDomainKey;
          const value = entry.value !== null && entry.value !== undefined ? Number(entry.value) : null;
          const interpretation = interpretScore(domain, value);
          return (
            <div key={entry.dataKey}>
              <div className="flex items-center justify-between gap-4 text-xs">
                <span
                  className={`flex items-center gap-1.5 font-bold ${
                    darkMode ? "text-white/70" : "text-[#5B6069]"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className={`font-black tabular-nums ${darkMode ? "text-white" : "text-[#111827]"}`}>
                  {value !== null ? value.toFixed(1) : "\u2014"}
                </span>
              </div>
              {interpretation && (
                <p
                  className={`mt-0.5 pl-3 text-xs font-medium leading-snug ${
                    darkMode ? "text-white/50" : "text-[#8A8F98]"
                  }`}
                >
                  {interpretation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function toChartRows(weeks: DomainWeekPoint[]) {
  return weeks.map((week, i) => ({
    weekLabel: `Week ${i + 1}`,
    weekTick: formatWeekTick(week.weekStartDate),
    weekStartDate: week.weekStartDate,
    cognitive: week.cognitive,
    emotional: week.emotional,
    behavioral: week.behavioral,
    social: week.social,
  }));
}

function useHolisticDomainTrendsPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Advisory sections — same hook and tabs the Attendance and Holistic
  // Overview pages use. `sections === undefined` means still loading;
  // `section` is the currently selected one.
  const { sections, section, selectSection, error: sectionError, retry: retrySections } = useSelectedAdvisorySection();

  const [termsLoading, setTermsLoading] = useState(true);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [termsAttempt, setTermsAttempt] = useState(0);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [trendsAttempt, setTrendsAttempt] = useState(0);
  const [terms, setTerms] = useState<GradingPeriod[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(
    searchParams.get("term") ? Number(searchParams.get("term")) : null
  );

  const [trendsData, setTrendsData] = useState<DomainTrendsOverview | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [hiddenDomains, setHiddenDomains] = useState<Set<ChartDomainKey>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("overall");

  const activeWeeks = useMemo(() => {
    if (!trendsData) return [];
    if (activeTab === "overall") return trendsData.overallWeeks;
    return trendsData.subjects.find((s) => s.subjectSectionId === activeTab)?.weeks ?? [];
  }, [trendsData, activeTab]);

  const chartRows = useMemo(() => toChartRows(activeWeeks), [activeWeeks]);

  const domainSummaries = useMemo(() => {
    return (Object.keys(CHART_DOMAIN_META) as ChartDomainKey[]).map((key) => {
      const values = chartRows.map((r) => r[key]).filter((v): v is number => v !== null);
      const latest = values.length ? values[values.length - 1] : null;
      const previous = values.length > 1 ? values[values.length - 2] : null;
      const delta = latest !== null && previous !== null ? Math.round((latest - previous) * 10) / 10 : null;
      return { key, latest, delta };
    });
  }, [chartRows]);

  const compositeScore = useMemo(() => {
    const defined = domainSummaries.map((d) => d.latest).filter((v): v is number => v !== null);
    if (!defined.length) return null;
    return Math.round((defined.reduce((a, b) => a + b, 0) / defined.length) * 10) / 10;
  }, [domainSummaries]);

  const strongestDomain = useMemo(() => {
    const withScores = domainSummaries.filter((d) => d.latest !== null);
    if (!withScores.length) return null;
    return withScores.reduce((a, b) => ((b.latest as number) > (a.latest as number) ? b : a));
  }, [domainSummaries]);

  const weakestDomain = useMemo(() => {
    const withScores = domainSummaries.filter((d) => d.latest !== null);
    if (!withScores.length) return null;
    return withScores.reduce((a, b) => ((b.latest as number) < (a.latest as number) ? b : a));
  }, [domainSummaries]);

  const toggleDomain = (key: ChartDomainKey) => {
    setHiddenDomains((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;

  const activeSubjectName =
    activeTab === "overall"
      ? null
      : trendsData?.subjects.find((s) => s.subjectSectionId === activeTab)?.subjectName ?? null;

  const error = sectionError || termsError || trendsError;
  const loading = !error && (sections === undefined || termsLoading || Boolean(section && selectedTerm !== null && (!trendsData || trendsLoading)));
  const subjectView = `domain-trend-subjects-${section?.classId ?? "default"}-${selectedTerm ?? "default"}`;
  const retry = () => { if (sectionError) retrySections(); if (termsError) setTermsAttempt(value => value + 1); if (trendsError) setTrendsAttempt(value => value + 1); };
  const renderBody = (pending: boolean) => !pending && sections !== undefined && !section ? <div className={cardClasses}><p className={`px-4 py-16 text-center text-xs font-medium ${textMuted}`}>No advisory class assigned to you.</p></div> : !pending && (!trendsData || chartRows.length === 0) ? <div className={cardClasses}><p className={`px-4 py-16 text-center text-xs font-medium ${textMuted}`}>No weekly records yet for this {activeTab === "overall" ? "term" : "subject"}.</p></div> : <div className="space-y-6"><>
            {/* ---------- 1. Narrative snapshot ---------- */}
            <section className={cardClasses} aria-label="Domain trends snapshot">
              <div className="flex flex-col sm:flex-row">
                {(pending || compositeScore !== null) && (
                  <div
                    className="sk-surface-brand flex shrink-0 flex-row items-center justify-between gap-3 px-5 py-4 sm:w-36 sm:flex-col sm:items-start sm:justify-center sm:gap-1"
                    style={{ backgroundColor: ACCENT }} data-sk-surface="brand"
                  >
                    <span data-sk-region="domain-trend-composite" className="text-3xl font-black leading-none tabular-nums text-white">
                      {pending ? <SkeletonText width="2.5ch" /> : compositeScore!.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide text-white/70">
                      <span data-sk-static="">Composite</span> · {pending ? <SkeletonText className="inline-block" width="8ch" /> : bandFor(compositeScore!).label}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1 p-4 sm:p-5">
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: ACCENT }}>
                    {activeTab === "overall" ? "Whole-class snapshot" : `${activeSubjectName} snapshot`}
                  </p>
                  <p data-sk-region="domain-trend-narrative" data-sk-variable="" data-sk-field="domain-trend-narrative" className={`mt-1.5 text-xs font-medium leading-relaxed sm:text-sm ${textPrimary}`}>
                    {pending ? <SkeletonParagraph field="domain-trend-narrative" typical={3} width="100%" /> : strongestDomain && weakestDomain && strongestDomain.key !== weakestDomain.key ? (
                      <>
                        {activeTab === "overall" ? "This class" : "This group"} is showing the most strength in{" "}
                        <span className="font-bold">
                          {CHART_DOMAIN_META[strongestDomain.key].label.toLowerCase()}
                        </span>
                        , while{" "}
                        <span className="font-bold">
                          {CHART_DOMAIN_META[weakestDomain.key].label.toLowerCase()}
                        </span>{" "}
                        is the domain most worth a closer look this week.
                      </>
                    ) : (
                      "Domain scores are holding steady across the board this week."
                    )}
                  </p>
                  <p className={`mt-1.5 text-xs font-medium ${textMuted}`}>
                    <span data-sk-static="">Based on</span> {pending ? <SkeletonText width="1ch" className="inline-block" /> : chartRows.length} week{chartRows.length === 1 ? "" : "s"} <span data-sk-static="">of ratings recorded so far in this term.</span>
                  </p>
                </div>
              </div>
            </section>

            {/* ---------- 2. Domain scorecards ---------- */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {domainSummaries.map(({ key, latest, delta }) => {
                const meta = CHART_DOMAIN_META[key];
                const isHidden = hiddenDomains.has(key);
                const band = latest !== null ? bandFor(latest) : null;
                const DeltaIcon = delta === null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
                const deltaColor = delta === null ? undefined : delta > 0 ? "#3F8A5F" : delta < 0 ? "#B5453F" : "#9CA3AF";

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDomain(key)}
                    className={`relative flex items-stretch overflow-hidden rounded-2xl border text-left shadow-card transition-opacity ${panelBorder} ${panelBg}`}
                    style={{ opacity: isHidden ? 0.5 : 1 }}
                  >
                    <span
                      className="flex w-14 shrink-0 items-center justify-center"
                      style={{ backgroundColor: NEUTRAL_ICON }}
                    >
                      <meta.Icon size={18} className="text-white" />
                    </span>

                    <div className="min-w-0 flex-1 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-xs font-bold uppercase tracking-wider ${textMuted}`}>
                          {meta.label}
                        </p>
                        {(pending || band) && (
                          <span
                            className="shrink-0 rounded-full px-1.5 py-0.5 text-xs font-bold"
                            style={{ backgroundColor: pending ? undefined : `color-mix(in srgb, ${band!.color} 8.63%, transparent)`, color: band?.color }}
                          >
                            {pending ? <SkeletonText width={key === "cognitive" ? "6ch" : "8ch"} /> : band!.label}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span data-sk-region={`domain-trend-score-${key}`} className={`text-lg font-black tabular-nums leading-none ${textPrimary}`}>
                          {pending ? <SkeletonText width="2.5ch" /> : latest !== null ? latest.toFixed(1) : "\u2014"}
                        </span>
                        <span className={`text-xs font-bold ${textMuted}`}>/ 5.0</span>
                        {pending ? <SkeletonText width="3ch" className="ml-auto text-xs" /> : DeltaIcon && (
                          <span
                            className="ml-auto flex items-center gap-0.5 text-xs font-bold"
                            style={{ color: deltaColor }}
                          >
                            <DeltaIcon size={10} />
                            {Math.abs(delta as number).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ---------- 3. Trend chart ---------- */}
            <section className={cardClasses} aria-label="Weekly domain progression chart">
              <div
                className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${panelBorder}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textPrimary}`}>
                    <Sparkles size={13} style={{ color: ACCENT }} />
                    Weekly Progression
                  </p>
                  <p className={`truncate text-xs font-medium ${textMuted}`}>
                    · Tap a card above to isolate or hide its line
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{ backgroundColor: `color-mix(in srgb, ${ACCENT} 7.06%, transparent)`, color: ACCENT }}
                >
                  {activeTab === "overall" ? "All subjects pooled" : activeSubjectName}
                </span>
              </div>

              <div className="px-3 pb-4 pt-4 sm:px-4">
                <div className="sk-surface-domain-trend-plot relative h-80 w-full" data-sk-region="domain-trend-plot" data-sk-chart="lines">
                  <ResponsiveContainer width="100%" height="100%">
                    <RLineChart data={pending ? Array.from({length: lastKnownCount(`${subjectView}-weeks`, 3)}, (_, index) => ({ weekLabel: "", weekStartDate: "", weekTick: String(index), cognitive: null, emotional: null, behavioral: null, social: null })) : chartRows} margin={{ top: 8, right: 20, bottom: 0, left: -8 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={darkMode ? "var(--color-grid-line-dark)" : "var(--color-grid-line)"}
                        vertical={false}
                      />
                      {BANDS.map((band) => (
                        <ReferenceArea
                          key={band.label}
                          y1={band.from}
                          y2={band.to}
                          fill={band.color}
                          fillOpacity={darkMode ? 0.06 : 0.04}
                          strokeWidth={0}
                        />
                      ))}
                      <XAxis
                        dataKey="weekTick"
                        tick={pending ? (props: {x?: number | string; y?: number | string}) => <foreignObject x={Number(props.x ?? 0) - 17} y={Number(props.y ?? 0)} width={34} height={16}><SkeletonText width="4ch" style={{fontSize: 10.5, lineHeight: "16px"}} /></foreignObject> : { fontSize: 10.5, fontWeight: 700, fill: darkMode ? "var(--color-axis-dark)" : "var(--color-axis)" }}
                        axisLine={{ stroke: darkMode ? "var(--color-grid-line-dark)" : "var(--color-grid-line)" }}
                        tickLine={false}
                        interval={0}
                        padding={{ left: 30, right: 30 }}
                      />
                      <YAxis
                        domain={[1, 5]}
                        ticks={[1, 1.5, 2.5, 3.5, 4.5, 5]}
                        tick={{ fontSize: 10, fontWeight: 600, fill: darkMode ? "var(--color-axis-dark)" : "var(--color-axis)" }}
                        axisLine={false}
                        tickLine={false}
                        width={28}
                      />
                      <Tooltip
                        content={<CustomTooltip darkMode={darkMode} />}
                        cursor={{ stroke: ACCENT, strokeWidth: 1, strokeDasharray: "4 4" }}
                      />
                      {(Object.keys(CHART_DOMAIN_META) as ChartDomainKey[]).map((key) => {
                        const meta = CHART_DOMAIN_META[key];
                        const isHidden = hiddenDomains.has(key);
                        return (
                          <Line
                            key={key}
                            name={meta.label}
                            dataKey={key}
                            type="monotone"
                            stroke={meta.color}
                            strokeWidth={isHidden ? 1.5 : 2.5}
                            strokeOpacity={isHidden ? 0.15 : 1}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            dot={
                              isHidden
                                ? false
                                : { r: 3, strokeWidth: 2, stroke: darkMode ? "#111827" : "#FFFFFF", fill: meta.color }
                            }
                            activeDot={
                              isHidden
                                ? false
                                : { r: 5, strokeWidth: 2, stroke: darkMode ? "#111827" : "#FFFFFF", fill: meta.color }
                            }
                            connectNulls
                            isAnimationActive
                            animationDuration={450}
                          />
                        );
                      })}
                    </RLineChart>
                  </ResponsiveContainer>
                  {pending && <div aria-hidden="true" className="pointer-events-none absolute bottom-6 left-7 right-5 top-2">{[0, 1, 2, 3].map(index => <Skeleton key={index} data-sk-line="" className="absolute inset-0 h-full w-full rounded-none" style={{ clipPath: `polygon(0% ${68-index*12}%, 25% ${45-index*7}%, 50% ${56-index*9}%, 75% ${30+index*5}%, 100% ${18+index*8}%, 100% ${20+index*8}%, 75% ${32+index*5}%, 50% ${58-index*9}%, 25% ${47-index*7}%, 0% ${70-index*12}%)` }} />)}</div>}
                </div>

                {/* Legend, doubling as domain toggles */}
                <div className={`mt-4 flex flex-wrap items-center justify-center gap-2 border-t pt-4 ${panelBorder}`}>
                  {(Object.keys(CHART_DOMAIN_META) as ChartDomainKey[]).map((key) => {
                    const meta = CHART_DOMAIN_META[key];
                    const isHidden = hiddenDomains.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleDomain(key)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-opacity ${panelBorder} ${
                          darkMode ? "hover:bg-white/10" : "hover:bg-black/5"
                        } ${isHidden ? "opacity-40" : ""}`}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                        <span className={textPrimary}>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ---------- 4. Interpreted results ---------- */}
            <section className={cardClasses} aria-label="Interpreted domain results">
              <div className={`border-b px-4 py-2.5 ${panelBorder}`}>
                <p className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>What the data means</p>
                <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                  A plain-language read of each domain's latest score, for{" "}
                  {activeTab === "overall" ? "the whole class" : activeSubjectName}
                </p>
              </div>

              <div
                className={`grid grid-cols-1 divide-y lg:grid-cols-2 lg:divide-y-0 ${
                  darkMode ? "divide-white/10" : "divide-black/10"
                }`}
              >
                {domainSummaries.map(({ key, latest, delta }, i) => {
                  const meta = CHART_DOMAIN_META[key];
                  const isHidden = hiddenDomains.has(key);
                  const band = latest !== null ? bandFor(latest) : null;
                  const interpretation = interpretScore(key, latest);
                  const DeltaIcon = delta === null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
                  const deltaColor = delta === null ? undefined : delta > 0 ? "#3F8A5F" : delta < 0 ? "#B5453F" : "#9CA3AF";
                  const isRightCol = i % 2 === 1;

                  return (
                    <div
                      key={key}
                      className={`relative flex gap-3.5 px-4 py-5 transition-opacity ${
                        isRightCol ? `lg:border-l ${panelBorder}` : ""
                      }`}
                      style={{ opacity: isHidden ? 0.45 : 1 }}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: NEUTRAL_ICON }}
                      >
                        <meta.Icon size={17} className="text-white" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className={`text-sm font-bold ${textPrimary}`}>{meta.label}</h3>
                          {(pending || band) && (
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                              style={{ backgroundColor: pending ? undefined : `color-mix(in srgb, ${band!.color} 8.63%, transparent)`, color: band?.color }}
                            >
                              {pending ? <SkeletonText width={key === "cognitive" ? "6ch" : "8ch"} /> : band!.label}
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`text-xs font-bold tabular-nums ${textMuted}`}>
                            {pending ? <SkeletonText width="2.5ch" className="inline-block" /> : latest !== null ? latest.toFixed(1) : "\u2014"}
                            <span className="text-xs font-medium">/5.0</span>
                          </span>
                          {pending ? <SkeletonText width="3ch" className="ml-auto text-xs" /> : DeltaIcon && (
                            <span
                              className="flex items-center gap-0.5 text-xs font-bold"
                              style={{ color: deltaColor }}
                            >
                              <DeltaIcon size={10} />
                              {Math.abs(delta as number).toFixed(1)}
                            </span>
                          )}
                        </div>

                        {pending ? <p data-sk-region={`domain-trend-interpretation-${key}`} data-sk-variable="" className={`mt-2 text-xs font-medium leading-relaxed ${textPrimary}`}><SkeletonParagraph field={`domain-trend-interpretation-${key}`} typical={3} width="100%" /></p> : interpretation ? (
                          <p data-sk-region={`domain-trend-interpretation-${key}`} data-sk-variable="" data-sk-field={`domain-trend-interpretation-${key}`} className={`mt-2 text-xs font-medium leading-relaxed ${textPrimary}`}>
                            {interpretation}
                          </p>
                        ) : (
                          <p data-sk-region={`domain-trend-interpretation-${key}`} data-sk-variable="" data-sk-field={`domain-trend-interpretation-${key}`} className={`mt-2 text-xs font-medium ${textMuted}`}>
                            Not enough data yet to interpret this domain.
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleDomain(key)}
                          className={`mt-2.5 text-xs font-bold ${textMuted} underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-70`}
                        >
                          {isHidden ? "Show on chart" : "Hide from chart"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section></></div>;

  return { content: ((
    <div className="w-full min-h-full pb-12">
      <div className="w-full space-y-6">
        {/* ---------- Header ---------- */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <BackButton
              onClick={() => navigate(-1)}
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
            />
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-maroon">
              <Activity size={28} />
            </span>
            <div>
              <h1 className={`qed-type-page-title ${textPrimary}`}>Domain Trends</h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
                Weekly ratings averaged across the students in the selected section — pooled across every subject they take, or narrowed to one.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
            {!error && (
              <AdvisorySectionTabs
                sections={sections ?? []}
                loading={sections === undefined}
                activeClassId={section?.classId ?? ""}
                onSelect={selectSection}
                darkMode={darkMode}
                panelBorder={panelBorder}
                textMuted={textMuted}
              />
            )}

            <div className="relative w-full sm:w-48">
              <LoadingFormValue loading={termsLoading && !error} name="domain-trends-term" width="9ch"><select
                value={selectedTerm ?? ""}
                onChange={(e) => setSelectedTerm(Number(e.target.value))}
                disabled={terms.length === 0}
                aria-label="Select term"
                className={`h-8 w-full appearance-none rounded-lg border pl-3 pr-7 text-xs font-bold outline-none transition-colors focus:border-maroon disabled:opacity-50 ${panelBg} ${panelBorder} ${textPrimary}`}
              >
                {terms.length === 0 && <option value="">No terms set up yet</option>}
                {terms.map((t) => (
                  <option key={t.id} value={t.termNumber}>
                    {t.termLabel}
                    {t.isActive ? " · Current" : ""}
                  </option>
                ))}
              </select></LoadingFormValue>
              <ChevronDown
                size={13}
                className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${textMuted}`}
              />
            </div>
          </div>
        </div>

        {/* ---------- Subject tabs (every subject this section takes) ---------- */}
        {!error && <LoadingRegion loading={loading && !trendsData} name="domain-trend-subject-tabs" variable skeleton={null} frame={pending => !pending && !trendsData?.subjects.length ? null : (
          <div
            className={`flex flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2 ${panelBg} ${panelBorder}`}
          >
            <button
              type="button"
              onClick={() => setActiveTab("overall")}
              className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-colors ${
                activeTab === "overall"
                  ? "bg-maroon text-white"
                  : `${textMuted} ${darkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`
              }`}
            >
              Overall
            </button>
            {(pending ? Array.from({length: lastKnownCount(subjectView, 2)}, (_, index) => ({ subjectSectionId: `pending-${index}`, subjectName: "" })) : trendsData?.subjects ?? []).map((subj, index) => (
              <button
                data-sk-region="domain-trend-subject" data-sk-variable="" disabled={pending} key={subj.subjectSectionId}
                type="button"
                onClick={() => setActiveTab(subj.subjectSectionId)}
                className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-colors ${
                  activeTab === subj.subjectSectionId
                    ? "bg-maroon text-white"
                    : `${textMuted} ${darkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`
                }`}
              >
                {pending ? <SkeletonText width={index % 2 ? "9ch" : "14ch"} /> : subj.subjectName}
              </button>
            ))}
          </div>)}>{null}</LoadingRegion>}

        <LoadingRegion loading={loading} error={error} retry={retry} name="domain-trends-body" variable skeleton={null} frame={renderBody} retainPrevious hasContent={chartRows.length > 0} onSettled={() => { rememberRows(subjectView, trendsData?.subjects.length ?? 0); rememberRows(`${subjectView}-weeks`, chartRows.length); }}>{null}</LoadingRegion>

      </div>
    </div>
  )), scope: { setTermsLoading, setTermsError, fetchGradingPeriodsGlobal, setTerms, setSelectedTerm, termsAttempt, selectedTerm, section, setSearchParams, setTrendsLoading, setTrendsError, fetchDomainTrendsOverview, setTrendsData, setActiveTab, trendsAttempt } };
}






export type HolisticDomainTrendsPageEffectScope = ReturnType<typeof useHolisticDomainTrendsPageState>["scope"];
export type HolisticDomainTrendsPageRouteProps = Record<string, never>;
export function HolisticDomainTrendsPageComposition(props: object & { effects?: (scope: HolisticDomainTrendsPageEffectScope) => import("react").ReactNode }) {
 const state = useHolisticDomainTrendsPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
