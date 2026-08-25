import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Filter,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  User,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import {
  fetchHolisticOverview,
  fetchGradingPeriodsGlobal,
  type HolisticOverviewStudent,
  type HolisticTrend,
  type GradingPeriod,
} from "./services/holistic.service";

const ACCENT = "#6B0000";

const evaluationFor = (average: number) => {
  if (average >= 4.5) return { remark: "Excellent", color: "#22C55E" };
  if (average >= 3.5) return { remark: "Good", color: "#34D399" };
  if (average >= 2.5) return { remark: "Average", color: "#F59E0B" };
  if (average >= 1.5) return { remark: "Needs Improvement", color: "#FB923C" };
  return { remark: "Critical", color: "#EF4444" };
};

const TREND_META: Record<HolisticTrend["trend"], { label: string; color: string }> = {
  Improving: { label: "Improving", color: "#22C55E" },
  Declining: { label: "Declining", color: "#EF4444" },
  Stable: { label: "Stable", color: "#6C757D" },
  "Insufficient Data": { label: "Not enough data yet", color: "#9CA3AF" },
  "No Data": { label: "No ratings yet", color: "#9CA3AF" },
};

function blendMySubjects(subjects: HolisticOverviewStudent["subjects"]): HolisticTrend {
  const withData = subjects.filter((s) => s.currentWeekAverage !== null);
  if (withData.length === 0) {
    return {
      weeksCount: 0,
      weeklyScores: [],
      pastAverage: null,
      recentAverage: null,
      currentWeekAverage: null,
      trend: "No Data",
    };
  }
  const avg = (key: "pastAverage" | "recentAverage" | "currentWeekAverage") => {
    const vals = withData.map((s) => s[key]).filter((v): v is number => v !== null);
    return vals.length
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      : null;
  };
  const pastAverage = avg("pastAverage");
  const recentAverage = avg("recentAverage");
  const currentWeekAverage = avg("currentWeekAverage");
  let trend: HolisticTrend["trend"] = "Insufficient Data";
  if (pastAverage !== null && recentAverage !== null) {
    const delta = recentAverage - pastAverage;
    trend = delta > 0.15 ? "Improving" : delta < -0.15 ? "Declining" : "Stable";
  }
  return {
    weeksCount: Math.max(...withData.map((s) => s.weeksCount)),
    weeklyScores: [],
    pastAverage,
    recentAverage,
    currentWeekAverage,
    trend,
  };
}

export function HolisticOverviewPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const [terms, setTerms] = useState<GradingPeriod[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [students, setStudents] = useState<HolisticOverviewStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchGradingPeriodsGlobal()
      .then((data) => {
        setTerms(data);
        const active = data.find((t) => t.isActive);
        setSelectedTerm(active?.termNumber ?? data[0]?.termNumber ?? 1);
      })
      .catch((err) => console.error("Failed to load terms:", err));
  }, []);

  useEffect(() => {
    if (selectedTerm === null) return;
    setLoading(true);
    fetchHolisticOverview(selectedTerm)
      .then(setStudents)
      .catch((err) => console.error("Failed to load holistic overview:", err))
      .finally(() => setLoading(false));
  }, [selectedTerm]);

  const primaryTrendFor = useMemo(
    () => (student: HolisticOverviewStudent) => student.overall ?? blendMySubjects(student.subjects),
    []
  );

  const counts = useMemo(() => {
    const tally: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const student of students) {
      const primary = primaryTrendFor(student);
      if (primary.currentWeekAverage === null) continue;
      const level = Math.min(5, Math.max(1, Math.round(primary.currentWeekAverage)));
      tally[level] += 1;
    }
    return tally;
  }, [students, primaryTrendFor]);

  const filtered = students.filter((student) => {
    if (statusFilter === "all") return true;
    const primary = primaryTrendFor(student);
    if (primary.currentWeekAverage === null) return false;
    return Math.round(primary.currentWeekAverage) === Number(statusFilter);
  });

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
            Student development
          </p>
          <h1 className={`mt-1 text-3xl font-black tracking-tight ${textPrimary}`}>
            Holistic overview
          </h1>
          <p className={`mt-2 max-w-2xl text-sm font-medium ${textMuted}`}>
            Current state, growth over the term, and a per-domain breakdown per student.
          </p>
        </div>

        <button
          type="button"
          disabled={selectedTerm === null}
          onClick={() => navigate(`domain-trends?term=${selectedTerm}`)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}
        >
          <Activity size={14} />
          Domain trends
          <ChevronRight size={14} />
        </button>
      </div>

      <div className={`${cardClasses} p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider mr-1 ${textMuted}`}>
            Term
          </span>
          {terms.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTerm(t.termNumber)}
              className={`rounded-xl border px-4 py-2 text-xs font-bold transition-colors ${
                selectedTerm === t.termNumber
                  ? "text-white"
                  : `${panelBorder} ${textMuted} ${darkMode ? "hover:bg-white/5" : "hover:bg-black/5"}`
              }`}
              style={
                selectedTerm === t.termNumber
                  ? { background: ACCENT, borderColor: ACCENT }
                  : undefined
              }
            >
              {t.termLabel}
              {!!t.isActive && <span className="ml-1.5 opacity-70">· Current</span>}
            </button>
          ))}
          {terms.length === 0 && (
            <p className={`text-xs font-semibold ${textMuted}`}>No terms set up yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[5, 4, 3, 2, 1].map((level) => {
          const evaluation = evaluationFor(level);
          const active = statusFilter === String(level);
          return (
            <button
              key={level}
              type="button"
              onClick={() => setStatusFilter(active ? "all" : String(level))}
              className={`rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                active ? "shadow-md" : ""
              } ${darkMode ? "border-white/10" : "border-black/6"}`}
              style={{
                backgroundColor: active ? `${evaluation.color}38` : `${evaluation.color}18`,
                borderColor: active ? evaluation.color : `${evaluation.color}45`,
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold ${textMuted}`}>{evaluation.remark}</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: evaluation.color }} />
              </span>
              <strong className={`mt-3 block text-3xl font-black tabular-nums ${textPrimary}`}>
                {counts[level]}
              </strong>
              <span className={`mt-1 block text-[11px] font-semibold ${textMuted}`}>students</span>
            </button>
          );
        })}
      </div>

      <section className={cardClasses} aria-label="Student holistic assessment roster">
        <div className={`flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${panelBorder}`}>
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: ACCENT }}
            >
              <SlidersHorizontal size={18} />
            </span>
            <div>
              <h2 className={`font-extrabold ${textPrimary}`}>Assessment roster</h2>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                Click a student to see their full profile.
              </p>
            </div>
          </div>

          <div className="relative shrink-0">
            <Filter
              size={14}
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`}
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`h-10 w-full appearance-none rounded-xl border py-2 pl-9 pr-9 text-xs font-bold outline-none transition focus:ring-2 sm:w-48 ${panelBg} ${panelBorder} ${textPrimary}`}
              style={{ "--tw-ring-color": `${ACCENT}55` } as CSSProperties}
            >
              <option value="all">All assessment levels</option>
              {[5, 4, 3, 2, 1].map((level) => (
                <option key={level} value={level}>
                  {evaluationFor(level).remark}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className={`px-5 py-16 text-center text-sm font-semibold ${textMuted}`}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className={`font-bold ${textPrimary}`}>No students found</p>
            <p className={`mt-1 text-sm ${textMuted}`}>Try selecting a different assessment level.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={darkMode ? "bg-[#0B1120]" : "bg-[#F8FAFC]"}>
                  {["Student", "Score", "Evaluation", "Trend", ""].map((h) => (
                    <th
                      key={h}
                      className={`whitespace-nowrap px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textMuted}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const primary = primaryTrendFor(student);
                  const evaluation =
                    primary.currentWeekAverage !== null ? evaluationFor(primary.currentWeekAverage) : null;
                  const trendMeta = TREND_META[primary.trend];

                  return (
                    <tr
                      key={student.studentId}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`${student.studentId}?term=${selectedTerm}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          navigate(`${student.studentId}?term=${selectedTerm}`);
                        }
                      }}
                      className={`cursor-pointer border-t ${panelBorder} transition-colors ${
                        darkMode ? "hover:bg-white/5" : "hover:bg-[#FFF8F8]"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? "bg-[#3A2222]" : "bg-[#F8EDEE]"}`}
                          >
                            <User size={16} style={{ color: ACCENT }} />
                          </span>
                          <div className="min-w-0">
                            <p className={`truncate font-extrabold ${textPrimary}`}>{student.studentName}</p>
                            <p className={`mt-0.5 truncate text-xs font-medium ${textMuted}`}>
                              {student.isAdvisory
                                ? "Overall (your advisory)"
                                : `${student.subjects.length} subject${student.subjects.length === 1 ? "" : "s"} you teach`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {primary.currentWeekAverage !== null ? (
                          <span>
                            <span className={`text-lg font-black tabular-nums ${textPrimary}`}>
                              {primary.currentWeekAverage.toFixed(1)}
                            </span>
                            <span className={`ml-1 text-xs font-semibold ${textMuted}`}>/ 5.0</span>
                          </span>
                        ) : (
                          <span className={`text-xs font-semibold ${textMuted}`}>—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {evaluation ? (
                          <span
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold"
                            style={{ backgroundColor: `${evaluation.color}18`, color: evaluation.color }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: evaluation.color }} />
                            {evaluation.remark}
                          </span>
                        ) : (
                          <span className={`text-xs font-semibold ${textMuted}`}>—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{ backgroundColor: `${trendMeta.color}18`, color: trendMeta.color }}
                        >
                          {primary.trend === "Improving" && <TrendingUp size={12} />}
                          {primary.trend === "Declining" && <TrendingDown size={12} />}
                          {trendMeta.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <ChevronRight size={16} className={`inline-block ${textMuted}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}