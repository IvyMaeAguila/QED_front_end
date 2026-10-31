import { AccountSelect } from "@shared/components/AccountSelect";
import { LoadingFormValue } from "@shared/loading/LoadingFormValue";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { useState } from "react";
import { Search } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@shared/query/queryClient";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { GradeSheetHeader } from "./components/GradeSheetHeader";
import { GradeSheetNotFound } from "./components/GradeSheetNotFound";
import { GradeSheetSummary } from "./components/GradeSheetSummary";
import { GradeSheetTable } from "./components/GradeSheetTable";
import { TermUnavailableModal } from "./components/TermUnavailableModal";
import { usePrincipalGradeSheet } from "./hooks/usePrincipalGradeSheet";
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

  const sheet = usePrincipalGradeSheet({ gradeLevelId: gradeLevelId ?? 0, gradingPeriodId, sectionId }, gradeLevelId !== undefined);
  const { gradingPeriods } = sheet;
  const scope = { gradingPeriodId, searchParams, setSearchParams, defaultGradingPeriodId: sheet.defaultGradingPeriodId };
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
    )), scope };
  }


  return { content: ((
    <>
      <GradeSheetContent
        key={sheet.dataScope}
        sheet={sheet}
        gradeLabel={gradeLabel}
        gradeLevelId={gradeLevelId}
        gradingPeriodId={gradingPeriodId}
        sectionId={sectionId}
        onTermChange={handleTermChange}
      />
      <TermUnavailableModal
        open={unavailableTerm !== null}
        termLabel={unavailableTerm ?? ""}
        onClose={() => setUnavailableTerm(null)}
        darkMode={darkMode}
      />
    </>
  )), scope };
}

interface GradeSheetContentProps {
  sheet: ReturnType<typeof usePrincipalGradeSheet>;
  gradeLabel: string;
  gradeLevelId: number;
  gradingPeriodId?: number;
  sectionId?: number;
  onTermChange: (value: string) => void;
}

function GradeSheetContent({
  sheet,
  gradeLabel,
  gradeLevelId,
  gradingPeriodId,
  sectionId,
  onTermChange,
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
    notFound, ready, retry, cachedOffline, gradingPeriods, periodsLoading, periodError, retryPeriods,
  } = sheet;
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

      {cachedOffline && <LoadingRegion loading={false} error={error} retry={retry} skeleton={null} name="grade-sheet-offline">{null}</LoadingRegion>}
      {error && !cachedOffline ? (
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
          <div className={`relative z-20 flex flex-col gap-2.5 rounded-xl border px-3 py-2 lg:flex-row lg:items-center lg:justify-between ${panelBg} ${panelBorder}`}>
            <div className="relative w-full lg:w-64">
              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 text-gray-400"><Search size={13} /></span>
              <input
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Search student..."
                aria-label="Search students by name or ID"
                className={`qed-filter-control w-full rounded-lg border pl-8 pr-2.5 font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${textPrimary} placeholder:text-gray-400 focus:border-maroon`}
              />
            </div>
            <div className="relative z-20 flex flex-wrap items-center gap-2">
              <AccountSelect data-account-select=""
                value={studentFilter}
                onChange={(event) => setStudentFilter(event.target.value)}
                aria-label="Filter students and grade ranking"
              >
                <option>All Students</option>
                <option>Highest Grades</option>
                <option>Lowest Grades</option>
                <option>Boys</option>
                <option>Girls</option>
              </AccountSelect>
                <LoadingFormValue loading={periodsLoading && gradingPeriods.length === 0} name="grade-sheet-term" intrinsic width="5ch" className="h-full"><AccountSelect data-account-select=""
                  value={String(gradingPeriodId)}
                  onChange={(event) => onTermChange(event.target.value)}
                  aria-label="Select grading term"
                >
                  {gradingPeriods.map((period) => (
                    <option key={period.id} value={String(period.id)}>{period.termLabel}</option>
                  ))}
                </AccountSelect></LoadingFormValue>
            </div>
          </div>
          <GradeSheetTable
            loading={loading}
            initialLoading={initialLoading}
            view={`principal-grade-${gradeLevelId}-${sectionId ?? "all"}-${gradingPeriodId ?? "default"}-${studentFilter}-${query}`}
            sectionName={sectionName ?? gradeLabel}
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
 return <QueryClientProvider client={queryClient}><PrincipalGradeSheetContent {...props} /></QueryClientProvider>;
}

function PrincipalGradeSheetContent(props: object & { effects?: (scope: PrincipalGradeSheetPageEffectScope) => import("react").ReactNode }) {
 const state = usePrincipalGradeSheetPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
