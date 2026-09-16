import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ChevronDown,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Brain,
  Heart,
  Compass,
  Users2,
  Activity,
} from "lucide-react";
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
import { useOutletContext, useNavigate, useSearchParams } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { BackButton } from "../../../shared/components/DashboardUI";
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
  cognitive: { label: "Cognitive", tagline: "How well concepts are landing", color: "#2563EB", Icon: Brain },
  emotional: { label: "Emotional", tagline: "Motivation and confidence", color: "#7C3AED", Icon: Heart },
  behavioral: { label: "Behavioral", tagline: "Focus and classroom conduct", color: "#B45309", Icon: Compass },
  social: { label: "Social", tagline: "Collaboration with peers", color: "#0891B2", Icon: Users2 },
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
        darkMode ? "border-white/10 bg-[#111827]/95" : "border-black/10 bg-white/95"
      }`}
    >
      <p className={`text-xs font-bold ${darkMode ? "text-white" : "text-[#111827]"}`}>{row.weekLabel}</p>
      <p className={`text-[10px] font-medium ${darkMode ? "text-white/50" : "text-[#8A8F98]"}`}>
        {formatWeekLong(row.weekStartDate)}
      </p>
      <div className="mt-2 space-y-2">
        {payload.map((entry: any) => {
          const domain = entry.dataKey as ChartDomainKey;
          const value = entry.value !== null && entry.value !== undefined ? Number(entry.value) : null;
          const interpretation = interpretScore(domain, value);
          return (
            <div key={entry.dataKey}>
              <div className="flex items-center justify-between gap-4 text-[11px]">
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
                  className={`mt-0.5 pl-3 text-[10px] font-medium leading-snug ${
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

export function HolisticDomainTrendsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [terms, setTerms] = useState<GradingPeriod[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(
    searchParams.get("term") ? Number(searchParams.get("term")) : null
  );

  const [trendsData, setTrendsData] = useState<DomainTrendsOverview | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [hiddenDomains, setHiddenDomains] = useState<Set<ChartDomainKey>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("overall");

  useEffect(() => {
    fetchGradingPeriodsGlobal()
      .then((data) => {
        setTerms(data);
        if (selectedTerm === null) {
          const active = data.find((t) => t.isActive);
          setSelectedTerm(active?.termNumber ?? data[0]?.termNumber ?? 1);
        }
      })
      .catch((err) => console.error("Failed to load terms:", err));
  }, []);

  useEffect(() => {
    if (selectedTerm === null) return;
    setSearchParams({ term: String(selectedTerm) }, { replace: true });
    setTrendsLoading(true);
    fetchDomainTrendsOverview(selectedTerm)
      .then((data) => {
        setTrendsData(data);
        setActiveTab((prev) =>
          prev === "overall" || data.subjects.some((s) => s.subjectSectionId === prev)
            ? prev
            : "overall"
        );
      })
      .catch((err) => console.error("Failed to load domain trends:", err))
      .finally(() => setTrendsLoading(false));
  }, [selectedTerm]);

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

  return (
    <div className="w-full min-h-full pb-12">
      <div className="w-full px-6 lg:px-8 pt-6 space-y-4">
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
              <h1 className={`text-lg font-black tracking-tight ${textPrimary}`}>Domain Trends</h1>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                Weekly ratings averaged across every student — pooled across subjects, or narrowed to one.
              </p>
            </div>
          </div>

          <div className="relative w-full shrink-0 sm:w-48">
            <select
              value={selectedTerm ?? ""}
              onChange={(e) => setSelectedTerm(Number(e.target.value))}
              disabled={terms.length === 0}
              aria-label="Select term"
              className={`h-8 w-full appearance-none rounded-lg border pl-3 pr-7 text-[11px] font-bold outline-none transition-colors focus:border-maroon disabled:opacity-50 ${panelBg} ${panelBorder} ${textPrimary}`}
            >
              {terms.length === 0 && <option value="">No terms set up yet</option>}
              {terms.map((t) => (
                <option key={t.id} value={t.termNumber}>
                  {t.termLabel}
                  {t.isActive ? " · Current" : ""}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${textMuted}`}
            />
          </div>
        </div>

        {/* ---------- Subject tabs ---------- */}
        {trendsData && trendsData.subjects.length > 0 && (
          <div
            className={`flex flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2 ${panelBg} ${panelBorder}`}
          >
            <button
              type="button"
              onClick={() => setActiveTab("overall")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition-colors ${
                activeTab === "overall"
                  ? "bg-maroon text-white"
                  : `${textMuted} ${darkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`
              }`}
            >
              Overall
            </button>
            {trendsData.subjects.map((subj) => (
              <button
                key={subj.subjectSectionId}
                type="button"
                onClick={() => setActiveTab(subj.subjectSectionId)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition-colors ${
                  activeTab === subj.subjectSectionId
                    ? "bg-maroon text-white"
                    : `${textMuted} ${darkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`
                }`}
              >
                {subj.subjectName}
              </button>
            ))}
          </div>
        )}

        {trendsLoading ? (
          <div className={cardClasses}>
            <p className={`px-4 py-16 text-center text-xs font-medium ${textMuted}`}>Loading...</p>
          </div>
        ) : !trendsData ? null : chartRows.length === 0 ? (
          <div className={cardClasses}>
            <p className={`px-4 py-16 text-center text-xs font-medium ${textMuted}`}>
              No weekly records yet for this {activeTab === "overall" ? "term" : "subject"}.
            </p>
          </div>
        ) : (
          <>
            {/* ---------- 1. Narrative snapshot ---------- */}
            <section className={cardClasses} aria-label="Domain trends snapshot">
              <div className="flex flex-col sm:flex-row">
                {compositeScore !== null && (
                  <div
                    className="flex shrink-0 flex-row items-center justify-between gap-3 px-5 py-4 sm:w-36 sm:flex-col sm:items-start sm:justify-center sm:gap-1"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <span className="text-3xl font-black leading-none tabular-nums text-white">
                      {compositeScore.toFixed(1)}
                    </span>
                    <span className="text-[10.5px] font-bold uppercase tracking-wide text-white/70">
                      Composite · {bandFor(compositeScore).label}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1 p-4 sm:p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: ACCENT }}>
                    {activeTab === "overall" ? "Whole-class snapshot" : `${activeSubjectName} snapshot`}
                  </p>
                  <p className={`mt-1.5 text-xs font-medium leading-relaxed sm:text-sm ${textPrimary}`}>
                    {strongestDomain && weakestDomain && strongestDomain.key !== weakestDomain.key ? (
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
                  <p className={`mt-1.5 text-[11px] font-medium ${textMuted}`}>
                    Based on {chartRows.length} week{chartRows.length === 1 ? "" : "s"} of ratings recorded so far in this term.
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
                        <p className={`truncate text-[10.5px] font-bold uppercase tracking-wider ${textMuted}`}>
                          {meta.label}
                        </p>
                        {band && (
                          <span
                            className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ backgroundColor: `${band.color}16`, color: band.color }}
                          >
                            {band.label}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span className={`text-lg font-black tabular-nums leading-none ${textPrimary}`}>
                          {latest !== null ? latest.toFixed(1) : "\u2014"}
                        </span>
                        <span className={`text-[10px] font-bold ${textMuted}`}>/ 5.0</span>
                        {DeltaIcon && (
                          <span
                            className="ml-auto flex items-center gap-0.5 text-[10px] font-bold"
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
                  <p className={`truncate text-[11px] font-medium ${textMuted}`}>
                    · Tap a card above to isolate or hide its line
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                  style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}
                >
                  {activeTab === "overall" ? "All subjects pooled" : activeSubjectName}
                </span>
              </div>

              <div className="px-3 pb-4 pt-4 sm:px-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RLineChart data={chartRows} margin={{ top: 8, right: 20, bottom: 0, left: -8 }}>
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
                        tick={{ fontSize: 10.5, fontWeight: 700, fill: darkMode ? "var(--color-axis-dark)" : "var(--color-axis)" }}
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
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-opacity ${panelBorder} ${
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
                <p className={`mt-0.5 text-[11px] font-medium ${textMuted}`}>
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
                          {band && (
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ backgroundColor: `${band.color}16`, color: band.color }}
                            >
                              {band.label}
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`text-xs font-bold tabular-nums ${textMuted}`}>
                            {latest !== null ? latest.toFixed(1) : "\u2014"}
                            <span className="text-[10px] font-medium">/5.0</span>
                          </span>
                          {DeltaIcon && (
                            <span
                              className="flex items-center gap-0.5 text-[10px] font-bold"
                              style={{ color: deltaColor }}
                            >
                              <DeltaIcon size={10} />
                              {Math.abs(delta as number).toFixed(1)}
                            </span>
                          )}
                        </div>

                        {interpretation ? (
                          <p className={`mt-2 text-xs font-medium leading-relaxed ${textPrimary}`}>
                            {interpretation}
                          </p>
                        ) : (
                          <p className={`mt-2 text-[11px] font-medium ${textMuted}`}>
                            Not enough data yet to interpret this domain.
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleDomain(key)}
                          className={`mt-2.5 text-[10.5px] font-bold ${textMuted} underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-70`}
                        >
                          {isHidden ? "Show on chart" : "Hide from chart"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}