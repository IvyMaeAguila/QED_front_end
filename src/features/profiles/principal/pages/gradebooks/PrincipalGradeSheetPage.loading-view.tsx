import { SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingFormValue } from "@shared/loading/LoadingFormValue";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { GradeSheetHeader } from "./components/GradeSheetHeader";
import { GradeSheetNotFound } from "./components/GradeSheetNotFound";
import { GradeSheetSummary } from "./components/GradeSheetSummary";
import { GradeSheetTable } from "./components/GradeSheetTable";
import { TermUnavailableModal } from "./components/TermUnavailableModal";
import { usePrincipalGradeSheet } from "./hooks/usePrincipalGradeSheet";
import {
fetchGradingPeriods,
type GradingPeriod,
} from "./services/gradebooks.service";
import { computeAverage,fullName,sortByLastName } from "./utils/gradeSheetUtils";
function parseId(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function usePrincipalGradeSheetPageState() {
  const { darkMode, panelBg, panelBorder, textMuted } =
    useOutletContext<AdminThemeContext>();
  const { grade } = useParams<{ grade: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const gradeLabel = grade ?? "";
  const gradeLevelId = parseId(searchParams.get("gradeLevelId"));
  const gradingPeriodId = parseId(searchParams.get("gradingPeriodId"));
  const sectionId = parseId(searchParams.get("sectionId"));

  const [periodError, setPeriodError] = useState<string | null>(null);
  const [periodAttempt, setPeriodAttempt] = useState(0);
  const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([]);
  // true habang naghihintay pa yung fetch ng grading periods
  const [periodsLoading, setPeriodsLoading] = useState(
    gradeLevelId !== undefined,
  );
  // Label ng term na hindi pa submitted (null = nakasara ang modal)
  const [unavailableTerm, setUnavailableTerm] = useState<string | null>(null);

  const handleTermChange = (value: string) => {
    const target = gradingPeriods.find((p) => String(p.id) === value);

    // Hindi pa submitted: huwag lumipat, ipakita ang modal
    if (target && !target.isSubmitted) {
      setUnavailableTerm(target.termLabel);
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set("gradingPeriodId", value);
    setSearchParams(next);
  };

  if (gradeLevelId === undefined) {
    return { content: ((
      <GradeSheetNotFound
        gradeLabel={gradeLabel}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textMuted={textMuted}
      />
    )), scope: { gradeLevelId, setPeriodsLoading, setPeriodError, fetchGradingPeriods, setGradingPeriods, gradingPeriodId, searchParams, setSearchParams, sectionId, periodAttempt } };
  }


  return { content: ((
    <>
      <GradeSheetContent
        gradeLabel={gradeLabel}
        gradeLevelId={gradeLevelId}
        gradingPeriodId={gradingPeriodId}
        periodsLoading={periodsLoading}
        periodError={periodError}
        retryPeriods={() => setPeriodAttempt(value => value + 1)}
        sectionId={sectionId}
        gradingPeriods={gradingPeriods}
        onTermChange={handleTermChange}
      />
      <TermUnavailableModal
        open={unavailableTerm !== null}
        termLabel={unavailableTerm ?? ""}
        onClose={() => setUnavailableTerm(null)}
        darkMode={darkMode}
      />
    </>
  )), scope: { gradeLevelId, setPeriodsLoading, setPeriodError, fetchGradingPeriods, setGradingPeriods, gradingPeriodId, searchParams, setSearchParams, sectionId, periodAttempt } };
}

interface GradeSheetContentProps {
  gradeLabel: string;
  gradeLevelId: number;
  gradingPeriodId?: number;
  periodsLoading: boolean;
  periodError: string | null;
  retryPeriods: () => void;
  sectionId?: number;
  gradingPeriods: GradingPeriod[];
  onTermChange: (value: string) => void;
}

function GradeSheetContent({
  gradeLabel,
  gradeLevelId,
  gradingPeriodId,
  sectionId,
  gradingPeriods,
  onTermChange,
  periodsLoading, periodError, retryPeriods,
}: GradeSheetContentProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState("All Students");

  const {
    students,
    subjects,
    schoolYear,
    sectionName,
    loading: sheetLoading,
    error: sheetError,
    notFound, ready, retry,
  } = usePrincipalGradeSheet({ gradeLevelId, gradingPeriodId: gradingPeriodId ?? 0, sectionId }, gradingPeriodId !== undefined && !periodError);
  const loading = periodsLoading || (gradingPeriodId !== undefined && sheetLoading);
  const error = periodError ?? sheetError;
  const initialLoading = loading && !ready && !error;


  const query = studentSearch.trim().toLocaleLowerCase();
  const filteredStudents = students.filter((student) => {
    const matchesGender = studentFilter === "Boys"
      ? student.gender === "Male"
      : studentFilter === "Girls"
        ? student.gender === "Female"
        : true;
    const matchesSearch = !query || `${fullName(student)} ${student.studentId}`.toLocaleLowerCase().includes(query);
    return matchesGender && matchesSearch;
  });
  const isRankingFilter = studentFilter === "Highest Grades" || studentFilter === "Lowest Grades";
  const orderedStudents = isRankingFilter
    ? [...filteredStudents].sort((a, b) => {
        const scoreA = a.overallAverage ?? computeAverage(a.grades, subjects);
        const scoreB = b.overallAverage ?? computeAverage(b.grades, subjects);
        const difference = scoreB - scoreA;
        return studentFilter === "Highest Grades" ? difference || sortByLastName(a, b) : -difference || sortByLastName(a, b);
      })
    : filteredStudents;
  const males = orderedStudents.filter((s) => s.gender === "Male").sort(isRankingFilter ? () => 0 : sortByLastName);
  const females = orderedStudents.filter((s) => s.gender === "Female").sort(isRankingFilter ? () => 0 : sortByLastName);
  const groups = isRankingFilter
    ? [{ label: studentFilter === "Highest Grades" ? "Highest score ranking" : "Lowest score ranking", students: orderedStudents }]
    : [
        ...(males.length ? [{ label: "Male", students: males }] : []),
        ...(females.length ? [{ label: "Female", students: females }] : []),
      ];

  const activeTermLabel = gradingPeriods.find((period) => period.id === gradingPeriodId)?.termLabel ?? "Term";

  return (
    <div className="flex flex-col gap-6 font-sans">
      <GradeSheetHeader
        gradeLabel={gradeLabel}
        loading={initialLoading}
        sectionName={sectionName}
        schoolYear={schoolYear}
        onBack={() => navigate("/principal/gradebooks")}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />

      {error ? (
        <LoadingRegion loading={false} error={error} retry={periodError ? retryPeriods : retry} skeleton={null} name="grade-sheet-error">{null}</LoadingRegion>
      ) : (!loading && (notFound || gradingPeriodId === undefined)) ? (
        <GradeSheetNotFound
          gradeLabel={gradeLabel}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textMuted={textMuted}
        />
      ) : (
        <>
          <GradeSheetSummary
            loading={initialLoading}
            totalStudents={students.length}
            maleCount={filteredStudents.filter((student) => student.gender === "Male").length}
            femaleCount={filteredStudents.filter((student) => student.gender === "Female").length}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />
          <div className={`flex flex-col gap-2.5 rounded-[12px] border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}>
            <div className="w-full sm:w-80">
              <input
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Search student name or ID..."
                aria-label="Search students by name or ID"
                className={`h-8 w-full rounded-lg border px-2.5 text-xs font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${textPrimary} placeholder:text-gray-400 focus:border-maroon`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`whitespace-nowrap text-xs font-semibold ${textMuted}`}>
                Showing <LoadingRegion as="span" loading={initialLoading} skeleton={<SkeletonText width="1ch" />}>{filteredStudents.length}</LoadingRegion> of <LoadingRegion as="span" loading={initialLoading} skeleton={<SkeletonText width="2ch" />}>{students.length}</LoadingRegion> students
              </span>
              <select
                value={studentFilter}
                onChange={(event) => setStudentFilter(event.target.value)}
                aria-label="Filter students and grade ranking"
                style={{ borderRadius: "8px" }}
                className={`h-8 rounded-lg border px-3 text-xs font-semibold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}
              >
                <option>All Students</option>
                <option>Highest Grades</option>
                <option>Lowest Grades</option>
                <option>Boys</option>
                <option>Girls</option>
              </select>
              <label className={`flex h-8 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${panelBg} ${panelBorder} ${textMuted}`}>
                <span>Term:</span>
                <LoadingFormValue loading={periodsLoading && gradingPeriods.length === 0} name="grade-sheet-term" intrinsic width="5ch" className="h-full"><select
                  value={String(gradingPeriodId)}
                  onChange={(event) => onTermChange(event.target.value)}
                  aria-label="Select grading term"
                  className={`h-full bg-transparent font-bold outline-none ${textPrimary}`}
                >
                  {gradingPeriods.map((period) => (
                    <option key={period.id} value={String(period.id)}>{period.termLabel}</option>
                  ))}
                </select></LoadingFormValue>
              </label>
            </div>
          </div>
          <GradeSheetTable
            loading={loading}
            initialLoading={initialLoading}
            termLoading={periodsLoading}
            view={`principal-grade-${gradeLevelId}-${sectionId ?? "all"}-${gradingPeriodId ?? "default"}-${studentFilter}-${query}`}
            sectionName={sectionName ?? gradeLabel}
            termLabel={activeTermLabel}
            totalStudents={students.length}
            subjects={subjects}
            males={groups.flatMap((group) => group.label === "Male" ? group.students : [])}
            females={groups.flatMap((group) => group.label === "Female" ? group.students : [])}
            rankedGroup={isRankingFilter ? groups[0] : undefined}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />
        </>
      )}
    </div>
  );
}





export type PrincipalGradeSheetPageEffectScope = ReturnType<typeof usePrincipalGradeSheetPageState>["scope"];
export type PrincipalGradeSheetPageRouteProps = Record<string, never>;
export function PrincipalGradeSheetPageComposition(props: object & { effects?: (scope: PrincipalGradeSheetPageEffectScope) => import("react").ReactNode }) {
 const state = usePrincipalGradeSheetPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
