import type { AdminThemeContext } from "../../../../../profiles/admin/pages/AdminLayout";
import { useProgressReport } from "./context/ProgressReportContext";
import { PeriodicRatingCard } from "./components/PeriodicRatingCard";
import { TermAverageCard } from "./components/QuarterlyAverageCard";
import { HolisticDevelopmentCard } from "./components/HolisticDevelopmentCard";
import { AttendanceRecordCard } from "./components/AttendanceRecordCard";
import { FormalReportTemplate } from "./components/FormalReportTemplate";
import { TermTabs } from "./components/TermTabs";
import type { DetailStudent } from "../GlobalTypes/types";

interface ProgressReportTabProps {
  theme: AdminThemeContext;
  student: DetailStudent;
  loading?: boolean;
}

export function ProgressReportContent({ theme, student, loading = false }: ProgressReportTabProps) {
  const {
    data,
    selectedTerm,
    setSelectedTerm,
    currentHolisticAssessment,
    currentAttendance,
  } = useProgressReport();
  const { darkMode, textPrimary } = theme;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${theme.textMuted}`}
          >
            Filter
          </p>
          <h2 className={`mt-1 text-sm font-bold ${textPrimary}`}>Term</h2>
        </div>
        <div className="flex items-center gap-3">
          <TermTabs
            active={selectedTerm}
            onChange={setSelectedTerm}
            darkMode={darkMode}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <PeriodicRatingCard loading={loading}
          rows={data.periodicRatings}
          termAverages={data.termAverages}
          theme={theme}
          student={student}
        />

        <TermAverageCard loading={loading}
          entries={data.termAverages}
          selectedTerm={selectedTerm}
          theme={theme}
          student={student}
        />
      </div>

      <HolisticDevelopmentCard loading={loading}
        assessment={currentHolisticAssessment}
        selectedTerm={selectedTerm}
        theme={theme}
        student={student}
      />

      <AttendanceRecordCard loading={loading}
        record={currentAttendance}
        theme={theme}
        student={student}
      />

      {/* Hidden off-screen template used by generateFormalPDF */}
      <FormalReportTemplate data={data} />
    </div>
  );
}

export default function ProgressReportTab({ theme, student, loading = false }: ProgressReportTabProps) {
  return <ProgressReportContent theme={theme} student={student} loading={loading} />;
}