import { useEffect, useMemo, useState } from "react";
import {
  TrendingDown,
  TrendingUp,
  User,
  ChevronRight,
  ChevronDown,
  Activity,
  Sparkles,
  Search,
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
  if (average >= 4.5) return { remark: "Excellent", color: "#157F3B" };
  if (average >= 3.5) return { remark: "Good", color: "#1D70D6" };
  if (average >= 2.5) return { remark: "Average", color: "#B45309" };
  if (average >= 1.5) return { remark: "Needs Improvement", color: "#C2255C" };
  return { remark: "Critical", color: "#DC2626" };
};

const TREND_META: Record<HolisticTrend["trend"], { label: string; color: string }> = {
  Improving: { label: "Improving", color: "#157F3B" },
  Declining: { label: "Declining", color: "#DC2626" },
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
  const [search, setSearch] = useState("");

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
    const matchesName = student.studentName.toLowerCase().includes(search.toLowerCase());
    if (!matchesName) return false;
    if (statusFilter === "all") return true;
    const primary = primaryTrendFor(student);
    if (primary.currentWeekAverage === null) return false;
    return Math.round(primary.currentWeekAverage) === Number(statusFilter);
  });

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;

  return (
    <div className="w-full min-h-full pb-12">
      <div className="w-full px-6 lg:px-8 pt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-maroon">
              <Sparkles size={28} />
            </span>
            <div>
              <h1 className={`text-lg font-black tracking-tight ${textPrimary}`}>Holistic Overview</h1>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                Current state, growth over the term, and a per-domain breakdown per student.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={selectedTerm === null}
            onClick={() => navigate(`domain-trends?term=${selectedTerm}`)}
            className={`flex h-8 shrink-0 items-center gap-1.5 self-start rounded-lg border bg-[#800000] px-3 text-[11px] font-extrabold text-white transition-colors hover:bg-[#650000] disabled:opacity-50 sm:self-center ${
              darkMode ? "border-white/10" : "border-black/10"
            }`}
          >
            <Activity size={12} />
            Domain Trends
            <ChevronRight size={12} />
          </button>
        </div>

        {/* Search + level filter chips — term dropdown now lives in the Assessment Roster header */}
        <div
          className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}
        >
          <div className="relative w-full sm:w-80">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
              <Search size={13} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              aria-label="Search student by name"
              className={`h-8 w-full rounded-lg border pl-8 pr-2.5 text-[11px] font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-maroon ${panelBg} ${panelBorder} ${textPrimary}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {[5, 4, 3, 2, 1].map((level) => {
              const evaluation = evaluationFor(level);
              const active = statusFilter === String(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setStatusFilter(active ? "all" : String(level))}
                  className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-bold transition-colors ${
                    active ? (darkMode ? "bg-white/10" : "bg-black/5") : ""
                  }`}
                  style={{ color: evaluation.color }}
                >
                  <i className="h-2 w-2 rounded-full" style={{ backgroundColor: evaluation.color }} />
                  {evaluation.remark}
                  <span className={textMuted}>({counts[level]})</span>
                </button>
              );
            })}
          </div>
        </div>

        <section className={cardClasses} aria-label="Student holistic assessment roster">
          <div
            className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${panelBorder}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textPrimary}`}>
                <Sparkles size={13} style={{ color: ACCENT }} />
                Assessment Roster
              </p>
              <p className={`truncate text-[11px] font-medium ${textMuted}`}>
                · {filtered.length} student{filtered.length === 1 ? "" : "s"}
              </p>
            </div>

            {/* Term dropdown, placed as the SectionCard-style header action, same slot Attendance uses for "Mark All Present" */}
            <div className="relative w-full shrink-0 sm:w-44">
              <select
                value={selectedTerm ?? ""}
                onChange={(e) => setSelectedTerm(Number(e.target.value))}
                disabled={terms.length === 0}
                aria-label="Select term"
                className={`h-7 w-full appearance-none rounded-md border pl-2.5 pr-7 text-[11px] font-bold outline-none transition-colors focus:border-maroon disabled:opacity-50 ${panelBg} ${panelBorder} ${textPrimary}`}
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
                size={12}
                className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${textMuted}`}
              />
            </div>
          </div>

          {loading ? (
            <p className={`px-4 py-16 text-center text-xs font-medium ${textMuted}`}>Loading...</p>
          ) : filtered.length === 0 ? (
            <p className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>
              No students found matching your search or filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
                    {["Student", "Score", "Evaluation", "Trend", ""].map((h) => (
                      <th
                        key={h}
                        className={`whitespace-nowrap px-4 py-2 text-left text-[11px] font-black uppercase tracking-wider ${textMuted}`}
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
                        className={`cursor-pointer border-t transition-colors ${
                          darkMode ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-black/5"
                        }`}
                      >
                        <td className="px-4 py-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                darkMode ? "bg-white/10" : "bg-black/5"
                              } ${textMuted}`}
                            >
                              <User size={13} />
                            </span>
                            <div className="min-w-0">
                              <p className={`truncate text-xs font-bold ${textPrimary}`}>{student.studentName}</p>
                              <p className={`truncate text-[11px] font-medium ${textMuted}`}>
                                {student.isAdvisory
                                  ? "Overall (your advisory)"
                                  : `${student.subjects.length} subject${student.subjects.length === 1 ? "" : "s"} you teach`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">
                          {primary.currentWeekAverage !== null ? (
                            <span>
                              <span className="text-[13px] font-black tabular-nums text-[#800000]">
                                {primary.currentWeekAverage.toFixed(1)}
                              </span>
                              <span className={`ml-1 text-[11px] font-medium ${textMuted}`}>/ 5.0</span>
                            </span>
                          ) : (
                            <span className={`text-[11px] font-medium ${textMuted}`}>—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">
                          {evaluation ? (
                            <span
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold"
                              style={{ color: evaluation.color }}
                            >
                              <i className="h-2 w-2 rounded-full" style={{ backgroundColor: evaluation.color }} />
                              {evaluation.remark}
                            </span>
                          ) : (
                            <span className={`text-[11px] font-medium ${textMuted}`}>—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold"
                            style={{ color: trendMeta.color }}
                          >
                            {primary.trend === "Improving" && <TrendingUp size={12} />}
                            {primary.trend === "Declining" && <TrendingDown size={12} />}
                            {trendMeta.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-right">
                          <ChevronRight size={14} className={`inline-block ${textMuted}`} />
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
    </div>
  );
}