import { useEffect, useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { usePrincipalGradeSheet } from "./hooks/usePrincipalGradeSheet";
import { DashboardStatus } from "./components/DashboardStatus";
import { GradeSheetNotFound } from "./components/GradeSheetNotFound";
import { GradeSheetHeader } from "./components/GradeSheetHeader";
import { GradeSheetSummary } from "./components/GradeSheetSummary";
import { GradeSheetTable } from "./components/GradeSheetTable";
import { TermUnavailableModal } from "./components/TermUnavailableModal";
import { computeAverage, fullName, sortByLastName } from "./utils/gradeSheetUtils";
import {
  fetchGradingPeriods,
  type GradingPeriod,
} from "./services/gradebooks.service";
import { Skeleton } from "@shared/components/SkeletonLoading";

function ProgressReportSkeleton() {
  return (
    <div className="flex flex-col gap-4 mt-1">
      <Skeleton className="h-3 w-40 ml-8" />
      <Skeleton className="h-3 w-40 ml-8 mb-6" />
      <div className="flex flex-col gap-3">
        <Skeleton className="mb-2 h-15 w-full rounded-lg" />
        <div className="">
          <Skeleton className="h-200 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function parseId(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export function PrincipalGradeSheetPage() {
  const { darkMode, panelBg, panelBorder, textMuted } =
    useOutletContext<AdminThemeContext>();
  const { grade } = useParams<{ grade: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const gradeLabel = grade ?? "";
  const gradeLevelId = parseId(searchParams.get("gradeLevelId"));
  const gradingPeriodId = parseId(searchParams.get("gradingPeriodId"));
  const sectionId = parseId(searchParams.get("sectionId"));

  const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([]);
  // true habang naghihintay pa yung fetch ng grading periods
  const [periodsLoading, setPeriodsLoading] = useState(
    gradeLevelId !== undefined,
  );
  // Label ng term na hindi pa submitted (null = nakasara ang modal)
  const [unavailableTerm, setUnavailableTerm] = useState<string | null>(null);

  useEffect(() => {
    if (gradeLevelId === undefined) {
      setPeriodsLoading(false);
      return;
    }
    const controller = new AbortController();
    setPeriodsLoading(true);

    fetchGradingPeriods({ gradeLevelId, sectionId }, controller.signal)
      .then(({ periods, defaultGradingPeriodId }) => {
        if (controller.signal.aborted) return;
        setGradingPeriods(periods);
        if (gradingPeriodId === undefined && defaultGradingPeriodId !== null) {
          const next = new URLSearchParams(searchParams);
          next.set("gradingPeriodId", String(defaultGradingPeriodId));
          setSearchParams(next, { replace: true });
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch grading periods:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setPeriodsLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeLevelId, sectionId]);

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
    return (
      <GradeSheetNotFound
        gradeLabel={gradeLabel}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textMuted={textMuted}
      />
    );
  }

  if (gradingPeriodId === undefined) {
    // Wala pang default period: skeleton habang naglo-load, NotFound lang pag talagang wala
    return periodsLoading ? (
      <ProgressReportSkeleton />
    ) : (
      <GradeSheetNotFound
        gradeLabel={gradeLabel}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textMuted={textMuted}
      />
    );
  }

  return (
    <>
      <GradeSheetContent
        gradeLabel={gradeLabel}
        gradeLevelId={gradeLevelId}
        gradingPeriodId={gradingPeriodId}
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
  );
}

interface GradeSheetContentProps {
  gradeLabel: string;
  gradeLevelId: number;
  gradingPeriodId: number;
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
    loading,
    error,
    notFound,
  } = usePrincipalGradeSheet({ gradeLevelId, gradingPeriodId, sectionId });

  if (loading) {
    return <ProgressReportSkeleton />;
  }

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
        sectionName={sectionName}
        schoolYear={schoolYear}
        onBack={() => navigate("/principal/gradebooks")}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />

      {error ? (
        <DashboardStatus
          loading={false}
          error={error}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textMuted={textMuted}
        />
      ) : notFound ? (
        <GradeSheetNotFound
          gradeLabel={gradeLabel}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textMuted={textMuted}
        />
      ) : (
        <>
          <GradeSheetSummary
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
                Showing {filteredStudents.length} of {students.length} students
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
                <select
                  value={String(gradingPeriodId)}
                  onChange={(event) => onTermChange(event.target.value)}
                  aria-label="Select grading term"
                  className={`h-full bg-transparent font-bold outline-none ${textPrimary}`}
                >
                  {gradingPeriods.map((period) => (
                    <option key={period.id} value={String(period.id)}>{period.termLabel}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <GradeSheetTable
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
