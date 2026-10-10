import {
Activity,
ChevronDown,
ChevronRight,
Search,
TrendingDown,
TrendingUp,
} from "lucide-react";
import { useMemo,useRef,useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import {
fetchGradingPeriodsGlobal,
fetchHolisticOverview,
type GradingPeriod,
type HolisticOverviewStudent,
type HolisticTrend,
} from "./services/holistic.service";
// NOTE: adjust this path to wherever the attendance hook lives relative to
// this page (it's "./services/..." on the Attendance page itself).
import { SkeletonAvatar,SkeletonText } from "@shared/components/SkeletonLoading";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import { LoadingFormValue } from "@shared/loading/LoadingFormValue";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { rememberColumns,rememberRows,skeletonRows,useColumnReservation } from "@shared/loading/reservations";
import { AdvisorySectionTabs } from "../attendance/components/AdvisorySectionTabs";
import { useSelectedAdvisorySection } from "../attendance/services/useSelectedAdvisorySection.service";


// Gender comes from the advisory roster (same source as the Attendance
// page), matched to holistic students by id — so the holistic API itself
// doesn't need to return gender.
function normalizeGender(value: unknown): "M" | "F" | null {
  const g = String(value ?? "").trim().toUpperCase();
  if (g === "F" || g === "FEMALE") return "F";
  if (g === "M" || g === "MALE") return "M";
  return null;
}

const evaluationFor = (average: number) => {
  if (average >= 4.5) return { remark: "Excellent", color: "#157F3B" };
  if (average >= 3.5) return { remark: "Good", color: "var(--semantic-success)" };
  if (average >= 2.5) return { remark: "Average", color: "#B45309" };
  if (average >= 1.5) return { remark: "Needs Improvement", color: "var(--semantic-warning)" };
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

function useHolisticOverviewPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  // Advisory class(es) — same hook the Attendance page uses.
  const { sections, section, selectSection, error: sectionError, retry: retrySections } = useSelectedAdvisorySection();

  const [termsLoading, setTermsLoading] = useState(true);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [termsAttempt, setTermsAttempt] = useState(0);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [overviewAttempt, setOverviewAttempt] = useState(0);
  const [terms, setTerms] = useState<GradingPeriod[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [students, setStudents] = useState<HolisticOverviewStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Roster of the SELECTED advisory section (same source and tab behavior
  // as the Attendance page). Only students in that section are shown — not
  // everyone you teach a subject to.
  const { advisoryIds, genderById } = useMemo(() => {
    const ids = new Set<string>();
    const map = new Map<string, "M" | "F">();
    for (const r of section?.roster ?? []) {
      ids.add(String(r.id));
      const g = normalizeGender(r.gender);
      if (g) map.set(String(r.id), g);
    }
    return { advisoryIds: ids, genderById: map };
  }, [section]);

  const advisoryStudents = useMemo(
    () => students.filter((s) => advisoryIds.has(String(s.studentId))),
    [students, advisoryIds]
  );

  const primaryTrendFor = useMemo(
    () => (student: HolisticOverviewStudent) => student.overall ?? blendMySubjects(student.subjects),
    []
  );

  const counts = useMemo(() => {
    const tally: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const student of advisoryStudents) {
      const primary = primaryTrendFor(student);
      if (primary.currentWeekAverage === null) continue;
      const level = Math.min(5, Math.max(1, Math.round(primary.currentWeekAverage)));
      tally[level] += 1;
    }
    return tally;
  }, [advisoryStudents, primaryTrendFor]);

  const filtered = advisoryStudents.filter((student) => {
    const matchesName = student.studentName.toLowerCase().includes(search.toLowerCase());
    if (!matchesName) return false;
    if (statusFilter === "all") return true;
    const primary = primaryTrendFor(student);
    if (primary.currentWeekAverage === null) return false;
    return Math.round(primary.currentWeekAverage) === Number(statusFilter);
  });

  // Male / Female grouping like the Attendance roster (non-female = male).
  const { male, female } = useMemo(() => {
    const male: HolisticOverviewStudent[] = [];
    const female: HolisticOverviewStudent[] = [];
    for (const s of filtered) {
      if (genderById.get(String(s.studentId)) === "F") female.push(s);
      else male.push(s);
    }
    return { male, female };
  }, [filtered, genderById]);

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;

  const error = sectionError || termsError || overviewError;
  const dataLoading = !error && (loading || termsLoading || sections === undefined);
  const initialLoading = dataLoading && students.length === 0;
  const retry = () => { if (sectionError) retrySections(); if (termsError) setTermsAttempt(value => value + 1); if (overviewError) setOverviewAttempt(value => value + 1); };
  const view = `holistic-overview-${section?.classId ?? "default"}-${selectedTerm ?? "default"}-${statusFilter}-${search}`;
  const tableRef = useRef<HTMLTableElement>(null);
  const columns = [{label: "Student", typical: "Maria Alexandra Cruz"}, {label: "Score", typical: "3.9 / 5.0"}, {label: "Evaluation", typical: "Needs Improvement"}, {label: "Trend", typical: "Not enough data yet"}, {label: "", typical: ""}];
  const widths = useColumnReservation(view, columns, dataLoading);
  const renderRoster = (pending: boolean) => {
    if (!pending && advisoryIds.size === 0) return <p className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>No advisory class assigned to you.</p>;
    if (!pending && filtered.length === 0) return <p className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>No students found matching your search or filter.</p>;
    const rows: HolisticOverviewStudent[] = pending ? Array.from({length: skeletonRows(view, undefined, 48)}, (_, index) => ({studentId: `pending-${index}`, studentName: "", isAdvisory: true, subjects: [], overall: null})) : filtered;
    const groups = pending ? {male: rows.filter((_, index) => index % 2 === 0), female: rows.filter((_, index) => index % 2 !== 0)} : {male, female};
    return (            <div className="overflow-x-auto">
              <table ref={tableRef} className="teacher-user-table w-full text-sm">
                {pending && <colgroup>{widths.map((width, index) => <col key={index} style={{width}} />)}</colgroup>}
                <thead data-sk-region="holistic-roster-header">
                  <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
                    {columns.map(({label: h}) => (
                      <th
                        data-sk-static="" key={h}
                        className={`whitespace-nowrap px-4 py-2 text-left text-xs font-black uppercase tracking-wider ${textMuted}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.male.length > 0 && (
                    <>
                      {renderGroupHeader("Male")}
                      {groups.male.map((student, index) => renderStudentRow(student, pending, index))}
                    </>
                  )}
                  {groups.female.length > 0 && (
                    <>
                      {renderGroupHeader("Female")}
                      {groups.female.map((student, index) => renderStudentRow(student, pending, index))}
                    </>
                  )}
                </tbody>
              </table>
            </div>);
  };

  function renderStudentRow(student: HolisticOverviewStudent, pending: boolean, index: number) {
    const primary = primaryTrendFor(student);
    const evaluation =
      primary.currentWeekAverage !== null ? evaluationFor(primary.currentWeekAverage) : null;
    const trendMeta = TREND_META[primary.trend];

    return (
      <tr
        data-sk-region="holistic-overview-row" data-sk-variable="" key={student.studentId}
        role="button"
        tabIndex={pending ? -1 : 0} aria-disabled={pending || undefined}
        onClick={() => { if (!pending) navigate(`${student.studentId}?term=${selectedTerm}`); }}
        onKeyDown={(e) => {
          if (!pending && (e.key === "Enter" || e.key === " ")) {
            navigate(`${student.studentId}?term=${selectedTerm}`);
          }
        }}
        className={`cursor-pointer border-t transition-colors ${
          darkMode ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-black/5"
        }`}
      >
        <td className="px-4 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span data-sk-region="holistic-overview-avatar" className="inline-flex h-7 w-7 shrink-0">{pending ? <SkeletonAvatar className="h-7 w-7" /> : <StudentAvatar gender={genderById.get(String(student.studentId))} name={student.studentName} />}</span>
            <div className="min-w-0">
              <p data-sk-region="holistic-overview-name" className={`truncate text-xs font-bold ${textPrimary}`}>{pending ? <SkeletonText width={index % 2 ? "13ch" : "18ch"} /> : student.studentName}</p>
              <p className={`truncate text-xs font-medium ${textMuted}`}>
                {pending ? <SkeletonText width={index % 2 ? "16ch" : "20ch"} /> : student.isAdvisory
                  ? "Overall (your advisory)"
                  : `${student.subjects.length} subject${student.subjects.length === 1 ? "" : "s"} you teach`}
              </p>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          {pending ? <span className="inline-flex items-center gap-1"><SkeletonText width="3ch" className="text-sm font-black" /><span className={`text-xs font-medium ${textMuted}`}>/ 5.0</span></span> : primary.currentWeekAverage !== null ? (
            <span>
              <span className="text-sm font-black tabular-nums text-brand-ink">
                {primary.currentWeekAverage.toFixed(1)}
              </span>
              <span className={`ml-1 text-xs font-medium ${textMuted}`}>/ 5.0</span>
            </span>
          ) : (
            <span className={`text-xs font-medium ${textMuted}`}>—</span>
          )}
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          {pending ? <SkeletonText width={index % 2 ? "12ch" : "8ch"} /> : evaluation ? (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold"
              style={{ color: evaluation.color }}
            >
              <i className="h-2 w-2 rounded-full" style={{ backgroundColor: evaluation.color }} />
              {evaluation.remark}
            </span>
          ) : (
            <span className={`text-xs font-medium ${textMuted}`}>—</span>
          )}
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <span
            className="inline-flex items-center gap-1 text-xs font-bold"
            style={{ color: trendMeta.color }}
          >
            {!pending && primary.trend === "Improving" && <TrendingUp size={12} />}
            {!pending && primary.trend === "Declining" && <TrendingDown size={12} />}
            {pending ? <SkeletonText width={index % 2 ? "16ch" : "11ch"} /> : trendMeta.label}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-2 text-right">
          <ChevronRight size={14} className={`inline-block ${textMuted}`} />
        </td>
      </tr>
    );
  }

  // Full-width divider row, styled like the Male / Female bars on the
  // Attendance page.
  function renderGroupHeader(label: string) {
    return (
      <tr>
        <th
          colSpan={5}
          className={`px-4 py-1.5 text-left text-xs font-black uppercase tracking-wider ${
            darkMode ? "bg-white/10" : "bg-brand-light"
          } ${textPrimary}`}
        >
          {label}
        </th>
      </tr>
    );
  }

  return { content: ((
    <div className="w-full min-h-full pb-12">
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div>
              <h1 className={`qed-type-page-title ${textPrimary}`}>Holistic Overview</h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
                Current state, growth over the term, and a per-domain breakdown per student.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
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
            <button
              type="button"
              disabled={selectedTerm === null}
              onClick={() => navigate(`domain-trends?term=${selectedTerm}`)}
              className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border bg-maroon px-3 text-xs font-extrabold text-white transition-colors hover:bg-maroon-light disabled:opacity-50 ${
                darkMode ? "border-white/10" : "border-black/10"
              }`}
            >
              <Activity size={12} />
              Domain Trends
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Search + level filter chips — term dropdown now lives in the Assessment Roster header */}
        <div
          className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}
        >
          <div className="relative w-full sm:w-80">
            <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 text-gray-400">
              <Search size={13} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              aria-label="Search student by name"
              className={`h-8 w-full rounded-lg border pl-8 pr-2.5 text-xs font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-maroon ${panelBg} ${panelBorder} ${textPrimary}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {[5, 4, 3, 2, 1].map((level) => {
              const evaluation = evaluationFor(level);
              const active = statusFilter === String(level);
              return (
                <button
                  key={level}
                  aria-label={initialLoading ? evaluation.remark : `${evaluation.remark} (${counts[level]})`}
                  type="button"
                  onClick={() => setStatusFilter(active ? "all" : String(level))}
                  className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-bold transition-colors ${
                    active ? (darkMode ? "bg-white/10" : "bg-black/5") : ""
                  }`}
                  style={{ color: evaluation.color }}
                >
                  <i className="h-2 w-2 rounded-full" style={{ backgroundColor: evaluation.color }} />
                  {evaluation.remark}
                  <span className={textMuted}>(<LoadingRegion as="span" loading={initialLoading} variable name={`holistic-level-count-${level}`} skeleton={<SkeletonText width={level % 2 ? "1ch" : "2ch"} />}>{counts[level]}</LoadingRegion>)</span>
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
                Assessment Roster
              </p>
              <p className={`truncate text-xs font-medium ${textMuted}`}>
                · <LoadingRegion as="span" loading={initialLoading} variable name="holistic-roster-count" skeleton={<SkeletonText width="2ch" />}>{filtered.length}</LoadingRegion> student{filtered.length === 1 ? "" : "s"}
              </p>
            </div>

            {/* Term dropdown, placed as the SectionCard-style header action, same slot Attendance uses for "Mark All Present" */}
            <div className="relative w-full shrink-0 sm:w-44">
              <LoadingFormValue loading={termsLoading && !error} name="holistic-overview-term" width="9ch"><select
                value={selectedTerm ?? ""}
                onChange={(e) => setSelectedTerm(Number(e.target.value))}
                disabled={terms.length === 0}
                aria-label="Select term"
                className={`h-7 w-full appearance-none rounded-md border pl-2.5 pr-7 text-xs font-bold outline-none transition-colors focus:border-maroon disabled:opacity-50 ${panelBg} ${panelBorder} ${textPrimary}`}
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
                size={12}
                className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${textMuted}`}
              />
            </div>
          </div>

          <LoadingRegion loading={dataLoading} error={error} retry={retry} name="holistic-overview-roster" variable autoColumns skeleton={null} frame={renderRoster} retainPrevious hasContent={filtered.length > 0} onSettled={() => { rememberRows(view, filtered.length); rememberColumns(view, tableRef.current); }}>{null}</LoadingRegion>

        </section>
      </div>
    </div>
  )), scope: { setTermsLoading, setTermsError, fetchGradingPeriodsGlobal, setTerms, setSelectedTerm, termsAttempt, selectedTerm, setLoading, setOverviewError, fetchHolisticOverview, setStudents, overviewAttempt } };
}




export type HolisticOverviewPageEffectScope = ReturnType<typeof useHolisticOverviewPageState>["scope"];
export type HolisticOverviewPageRouteProps = Record<string, never>;
export function HolisticOverviewPageComposition(props: object & { effects?: (scope: HolisticOverviewPageEffectScope) => import("react").ReactNode }) {
 const state = useHolisticOverviewPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
