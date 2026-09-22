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
import { sortByLastName } from "./utils/gradeSheetUtils";
import {
  fetchGradingPeriods,
  type GradingPeriod,
} from "./services/gradebooks.service";

function parseId(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/* ---------- Outer: nagbabasa ng URL, nagfe-fetch ng terms, at nagva-validate ---------- */
export function PrincipalGradeSheetPage() {
  const { panelBg, panelBorder, textMuted } =
    useOutletContext<AdminThemeContext>();
  const { grade } = useParams<{ grade: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const gradeLabel = grade ?? "";
  const gradeLevelId = parseId(searchParams.get("gradeLevelId"));
  const gradingPeriodId = parseId(searchParams.get("gradingPeriodId"));
  const sectionId = parseId(searchParams.get("sectionId"));

  const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([]);

  // Kunin ang listahan ng terms + yung pinaka-huling sinubmit na term
  // (base sa grade_submissions/subject_grade_submissions), tapos i-default
  // ang URL papunta doon kung wala pang gradingPeriodId.
  useEffect(() => {
    if (gradeLevelId === undefined) return;
    const controller = new AbortController();

    fetchGradingPeriods({ gradeLevelId, sectionId }, controller.signal)
      .then(({ periods, defaultGradingPeriodId }) => {
        setGradingPeriods(periods);
        if (gradingPeriodId === undefined && defaultGradingPeriodId !== null) {
          const next = new URLSearchParams(searchParams);
          next.set("gradingPeriodId", String(defaultGradingPeriodId));
          setSearchParams(next, { replace: true });
        }
      })
      .catch((err) => console.error("Failed to fetch grading periods:", err));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeLevelId, sectionId]);

  const handleTermChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("gradingPeriodId", value);
    setSearchParams(next);
  };

  // Parehong required ng service, kaya i-check ang dalawa
  if (gradeLevelId === undefined || gradingPeriodId === undefined) {
    return (
      <GradeSheetNotFound
        gradeLabel={gradeLabel}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textMuted={textMuted}
      />
    );
  }

  return (
    <GradeSheetContent
      gradeLabel={gradeLabel}
      gradeLevelId={gradeLevelId}
      gradingPeriodId={gradingPeriodId}
      sectionId={sectionId}
      gradingPeriods={gradingPeriods}
      onTermChange={handleTermChange}
    />
  );
}

/* ---------- Inner: nasa dito ang hook, sigurado nang may required ids ---------- */
interface GradeSheetContentProps {
  gradeLabel: string;
  gradeLevelId: number;
  gradingPeriodId: number; // required na
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

      {loading || error ? (
        <DashboardStatus
          loading={loading}
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
