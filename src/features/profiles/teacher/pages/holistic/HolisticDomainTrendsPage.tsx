import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Brain,
  Heart,
  Compass,
  Users2,
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
import {
  fetchGradingPeriodsGlobal,
  type GradingPeriod,
} from "./services/holistic.service";
import {
  fetchDomainTrendsOverview,
  type DomainTrendsOverview,
  type DomainWeekPoint,
} from "./services/holisticTrends.service";

const ACCENT = "#6B0000";

const CHART_DOMAIN_META = {
  cognitive: { label: "Cognitive", tagline: "How well concepts are landing", color: "#2563EB", Icon: Brain },
  emotional: { label: "Emotional", tagline: "Motivation and confidence", color: "#7C3AED", Icon: Heart },
  behavioral: { label: "Behavioral", tagline: "Focus and classroom conduct", color: "#B45309", Icon: Compass },
  social: { label: "Social", tagline: "Collaboration with peers", color: "#0891B2", Icon: Users2 },
} as const;

type ChartDomainKey = keyof typeof CHART_DOMAIN_META;

const BANDS = [
  { from: 4.5, to: 5.0, label: "Excellent", color: "#22C55E" },
  { from: 3.5, to: 4.5, label: "Good", color: "#34D399" },
  { from: 2.5, to: 3.5, label: "Average", color: "#F59E0B" },
  { from: 1.5, to: 2.5, label: "Needs Improvement", color: "#FB923C" },
  { from: 1.0, to: 1.5, label: "Critical", color: "#EF4444" },
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

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="min-w-64 rounded-2xl border border-black/6 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="text-sm font-semibold text-[#1A1A1A]">{row.weekLabel}</p>
      <p className="text-[11px] font-medium text-[#8A8F98]">{formatWeekLong(row.weekStartDate)}</p>
      <div className="mt-3 space-y-2.5">
        {payload.map((entry: any) => {
          const domain = entry.dataKey as ChartDomainKey;
          const value = entry.value !== null && entry.value !== undefined ? Number(entry.value) : null;
          const interpretation = interpretScore(domain, value);
          return (
            <div key={entry.dataKey}>
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-[#5B6069]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-semibold tabular-nums text-[#1A1A1A]">
                  {value !== null ? value.toFixed(1) : "\u2014"}
                </span>
              </div>
              {interpretation && (
                <p className="mt-0.5 pl-3 text-[10.5px] font-medium leading-snug text-[#8A8F98]">
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

  const surface = `rounded-2xl border ${panelBorder} ${panelBg} shadow-[0_1px_2px_rgba(0,0,0,0.04)]`;
  const subtleFill = darkMode ? "bg-white/[0.04]" : "bg-black/[0.025]";
  const subtleHover = darkMode ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.04]";
  const hairline = darkMode ? "border-white/[0.08]" : "border-black/[0.06]";

  const activeSubjectName =
    activeTab === "overall"
      ? null
      : trendsData?.subjects.find((s) => s.subjectSectionId === activeTab)?.subjectName ?? null;

  return (
    <div className="space-y-7 pb-14">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`mb-3 inline-flex items-center gap-1.5 text-xs font-medium ${textMuted} transition-opacity hover:opacity-70`}
          >
            <ArrowLeft size={14} />
            Back to overview
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
            Student development
          </p>
          <h1 className={`mt-1.5 text-[28px] font-semibold tracking-tight ${textPrimary}`}>
            Domain trends
          </h1>
          <p className={`mt-2 max-w-2xl text-[13.5px] font-medium leading-relaxed ${textMuted}`}>
            Weekly ratings averaged across every student — pooled across all subjects, or narrowed to one.
          </p>
        </div>

        <div className="relative w-full shrink-0 sm:w-56">
          <select
            value={selectedTerm ?? ""}
            onChange={(e) => setSelectedTerm(Number(e.target.value))}
            className={`h-10 w-full appearance-none rounded-xl border px-3.5 pr-9 text-[13px] font-semibold outline-none transition focus:ring-2 ${panelBg} ${panelBorder} ${textPrimary}`}
            style={{ "--tw-ring-color": `${ACCENT}40` } as CSSProperties}
          >
            {terms.map((t) => (
              <option key={t.id} value={t.termNumber}>
                {t.termLabel}
                {t.isActive ? " · Current" : ""}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 ${textMuted}`}
          />
        </div>
      </div>

      {/* ---------- Subject tabs ---------- */}
      {trendsData && trendsData.subjects.length > 0 && (
        <div className={`inline-flex max-w-full flex-wrap gap-1 rounded-2xl border p-1 ${hairline} ${subtleFill}`}>
          <button
            onClick={() => setActiveTab("overall")}
            className={`rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              activeTab === "overall" ? "text-white shadow-sm" : `${textMuted} ${subtleHover}`
            }`}
            style={{
              ...(activeTab === "overall" ? { background: ACCENT } : {}),
              ["--tw-ring-color" as string]: ACCENT,
            }}
          >
            Overall
          </button>
          {trendsData.subjects.map((subj) => (
            <button
              key={subj.subjectSectionId}
              onClick={() => setActiveTab(subj.subjectSectionId)}
              className={`rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                activeTab === subj.subjectSectionId ? "text-white shadow-sm" : `${textMuted} ${subtleHover}`
              }`}
              style={{
                ...(activeTab === subj.subjectSectionId ? { background: ACCENT } : {}),
                ["--tw-ring-color" as string]: ACCENT,
              }}
            >
              {subj.subjectName}
            </button>
          ))}
        </div>
      )}

      {trendsLoading ? (
        <div className={`${surface} py-24 text-center`}>
          <p className={`text-[13px] font-medium ${textMuted}`}>Loading…</p>
        </div>
      ) : !trendsData ? null : chartRows.length === 0 ? (
        <div className={`${surface} py-24 text-center`}>
          <p className={`text-[13px] font-medium ${textMuted}`}>
            No weekly records yet for this {activeTab === "overall" ? "term" : "subject"}.
          </p>
        </div>
      ) : (
        <>
          {/* ---------- 1. Narrative snapshot — the overall result, first thing you see ---------- */}
          <div className={`${surface} flex flex-col gap-5 p-6 sm:flex-row sm:items-center`}>
            {compositeScore !== null && (
              <div className="flex shrink-0 items-center gap-4">
                <div
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: `${bandFor(compositeScore).color}55`,
                    backgroundColor: `${bandFor(compositeScore).color}0F`,
                  }}
                >
                  <span className={`text-xl font-semibold tabular-nums ${textPrimary}`}>
                    {compositeScore.toFixed(1)}
                  </span>
                  <span
                    className="text-[8.5px] font-semibold uppercase tracking-wide"
                    style={{ color: bandFor(compositeScore).color }}
                  >
                    {bandFor(compositeScore).label}
                  </span>
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p
                className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider"
                style={{ color: ACCENT }}
              >
                <Sparkles size={11} />
                {activeTab === "overall" ? "Whole-class snapshot" : `${activeSubjectName} snapshot`}
              </p>
              <p className={`mt-1 text-[13.5px] font-medium leading-relaxed ${textPrimary}`}>
                {strongestDomain && weakestDomain && strongestDomain.key !== weakestDomain.key ? (
                  <>
                    {activeTab === "overall" ? "This class" : "This group"} is showing the most strength in{" "}
                    <span style={{ color: CHART_DOMAIN_META[strongestDomain.key].color }}>
                      {CHART_DOMAIN_META[strongestDomain.key].label.toLowerCase()}
                    </span>
                    , while{" "}
                    <span style={{ color: CHART_DOMAIN_META[weakestDomain.key].color }}>
                      {CHART_DOMAIN_META[weakestDomain.key].label.toLowerCase()}
                    </span>{" "}
                    is the domain most worth a closer look this week.
                  </>
                ) : (
                  "Domain scores are holding steady across the board this week."
                )}
              </p>
              <p className={`mt-1.5 text-[11.5px] font-medium ${textMuted}`}>
                Based on {chartRows.length} week{chartRows.length === 1 ? "" : "s"} of ratings recorded so far in this term.
              </p>
            </div>
          </div>

          {/* ---------- 2. Domain grade cards — compact scorecards above the chart ---------- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {domainSummaries.map(({ key, latest, delta }) => {
              const meta = CHART_DOMAIN_META[key];
              const isHidden = hiddenDomains.has(key);
              const band = latest !== null ? bandFor(latest) : null;
              const DeltaIcon = delta === null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
              const deltaColor = delta === null ? undefined : delta > 0 ? "#22C55E" : delta < 0 ? "#EF4444" : "#9CA3AF";

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDomain(key)}
                  className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${hairline} ${panelBg}`}
                  style={{ opacity: isHidden ? 0.5 : 1 }}
                >
                  <span
                    className="absolute inset-y-0 left-0 w-0.75"
                    style={{ backgroundColor: meta.color, opacity: isHidden ? 0.3 : 1 }}
                  />
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${meta.color}14`, color: meta.color }}
                  >
                    <meta.Icon size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-[11px] font-semibold uppercase tracking-wider ${textMuted}`}>
                        {meta.label}
                      </p>
                      {band && (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                          style={{ backgroundColor: `${band.color}16`, color: band.color }}
                        >
                          {band.label}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span className={`text-2xl font-semibold tabular-nums leading-none ${textPrimary}`}>
                        {latest !== null ? latest.toFixed(1) : "\u2014"}
                      </span>
                      <span className={`text-[10.5px] font-semibold ${textMuted}`}>/ 5.0</span>
                      {DeltaIcon && (
                        <span
                          className="ml-auto flex items-center gap-0.5 text-[10.5px] font-semibold"
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
          <div className={surface}>
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5 ${hairline}`}>
              <div>
                <h2 className={`text-[15px] font-semibold ${textPrimary}`}>Weekly progression</h2>
                <p className={`mt-0.5 text-[12px] font-medium ${textMuted}`}>
                  Tap a card above to isolate or hide its line
                </p>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-semibold"
                style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}
              >
                {activeTab === "overall" ? "All subjects pooled" : activeSubjectName}
              </span>
            </div>

            <div className="px-4 pb-6 pt-5 sm:px-6">
              <div className="h-95 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RLineChart data={chartRows} margin={{ top: 8, right: 24, bottom: 0, left: -8 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? "#FFFFFF12" : "#0000000A"}
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
                      tick={{ fontSize: 11.5, fontWeight: 600, fill: darkMode ? "#9CA3AF" : "#8A8F98" }}
                      axisLine={{ stroke: darkMode ? "#FFFFFF1A" : "#0000001A" }}
                      tickLine={false}
                      interval={0}
                      padding={{ left: 40, right: 40 }}
                    />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 1.5, 2.5, 3.5, 4.5, 5]}
                      tick={{ fontSize: 11, fontWeight: 500, fill: darkMode ? "#9CA3AF" : "#8A8F98" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
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
                              : { r: 3.5, strokeWidth: 2, stroke: darkMode ? "#15181C" : "#FFFFFF", fill: meta.color }
                          }
                          activeDot={
                            isHidden
                              ? false
                              : { r: 6, strokeWidth: 2, stroke: darkMode ? "#15181C" : "#FFFFFF", fill: meta.color }
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
              <div className={`mt-5 flex flex-wrap items-center justify-center gap-2 border-t pt-5 ${hairline}`}>
                {(Object.keys(CHART_DOMAIN_META) as ChartDomainKey[]).map((key) => {
                  const meta = CHART_DOMAIN_META[key];
                  const isHidden = hiddenDomains.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDomain(key)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all ${hairline} ${subtleHover} ${
                        isHidden ? "opacity-40" : ""
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                      <span className={textPrimary}>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ---------- 4. Interpreted results — the dedicated, emphasized reading of the data ---------- */}
          <div className={surface}>
            <div className={`flex items-start gap-3 border-b px-6 py-5 ${hairline}`}>
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}
              >
                <Sparkles size={15} />
              </span>
              <div>
                <h2 className={`text-[16px] font-semibold ${textPrimary}`}>What the data means</h2>
                <p className={`mt-0.5 text-[12.5px] font-medium ${textMuted}`}>
                  A plain-language read of each domain's latest score, for{" "}
                  {activeTab === "overall" ? "the whole class" : activeSubjectName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-black/6 dark:divide-white/8 lg:grid-cols-2 lg:divide-y-0">
              {domainSummaries.map(({ key, latest, delta }, i) => {
                const meta = CHART_DOMAIN_META[key];
                const isHidden = hiddenDomains.has(key);
                const band = latest !== null ? bandFor(latest) : null;
                const interpretation = interpretScore(key, latest);
                const DeltaIcon = delta === null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
                const deltaColor = delta === null ? undefined : delta > 0 ? "#22C55E" : delta < 0 ? "#EF4444" : "#9CA3AF";
                const isRightCol = i % 2 === 1;

                return (
                  <div
                    key={key}
                    className={`relative flex gap-4 p-6 transition-opacity ${
                      isRightCol ? "lg:border-l" : ""
                    } ${hairline}`}
                    style={{ opacity: isHidden ? 0.45 : 1 }}
                  >
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${meta.color}14`, color: meta.color }}
                    >
                      <meta.Icon size={20} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className={`text-[14px] font-semibold ${textPrimary}`}>{meta.label}</h3>
                        <span className={`text-[13px] font-semibold tabular-nums ${textMuted}`}>
                          {latest !== null ? latest.toFixed(1) : "\u2014"}
                          <span className="text-[11px] font-medium">/5.0</span>
                        </span>
                        {DeltaIcon && (
                          <span
                            className="flex items-center gap-0.5 text-[11px] font-semibold"
                            style={{ color: deltaColor }}
                          >
                            <DeltaIcon size={10} />
                            {Math.abs(delta as number).toFixed(1)}
                          </span>
                        )}
                        {band && (
                          <span
                            className="ml-auto rounded-full px-2.5 py-1 text-[9.5px] font-semibold"
                            style={{ backgroundColor: `${band.color}16`, color: band.color }}
                          >
                            {band.label}
                          </span>
                        )}
                      </div>

                      {interpretation ? (
                        <p className={`mt-2 text-[14px] font-medium leading-relaxed ${textPrimary}`}>
                          {interpretation}
                        </p>
                      ) : (
                        <p className={`mt-2 text-[13px] font-medium ${textMuted}`}>
                          Not enough data yet to interpret this domain.
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleDomain(key)}
                        className={`mt-3 text-[11px] font-semibold ${textMuted} underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-70`}
                      >
                        {isHidden ? "Show on chart" : "Hide from chart"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}