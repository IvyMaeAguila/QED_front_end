import { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import {
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { Dropdown } from "../../../shared/components/DashboardUI";
import { usePrincipalGradeSheet } from "./hooks/usePrincipalGradeSheet";
import { DashboardStatus } from "./components/DashboardStatus";
import { GradeSheetNotFound } from "./components/GradeSheetNotFound";
import { GradeSheetHeader } from "./components/GradeSheetHeader";
import { GradeSheetSummary } from "./components/GradeSheetSummary";
import { GradeSheetTable } from "./components/GradeSheetTable";
import { TermUnavailableModal } from "./components/TermUnavailableModal";
import { sortByLastName } from "./utils/gradeSheetUtils";
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

  const males = students
    .filter((s) => s.gender === "Male")
    .sort(sortByLastName);
  const females = students
    .filter((s) => s.gender === "Female")
    .sort(sortByLastName);

  const termOptions = gradingPeriods.map((p) => ({
    label: p.termLabel,
    value: String(p.id),
  }));

  return (
    <div className="flex flex-col gap-6 font-sans">
      <GradeSheetHeader
        gradeLabel={sectionName ? `${gradeLabel} - ${sectionName}` : gradeLabel}
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
            maleCount={males.length}
            femaleCount={females.length}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />
          <GradeSheetTable
            subjects={subjects}
            males={males}
            females={females}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
            action={
              termOptions.length > 0 ? (
                <Dropdown
                  value={String(gradingPeriodId)}
                  onChange={onTermChange}
                  options={termOptions}
                  icon={Filter}
                  label="Term"
                  panelBg={panelBg}
                  panelBorder={panelBorder}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                />
              ) : undefined
            }
          />
        </>
      )}
    </div>
  );
}