// ProgessReportTab.tsx
// import { Download } from "lucide-react";
import type { AdminThemeContext } from "../../../../../profiles/admin/pages/AdminLayout";
import { useProgressReport } from "./context/ProgressReportContext";
import { PeriodicRatingCard } from "./components/PeriodicRatingCard";
import { TermAverageCard } from "./components/QuarterlyAverageCard";
import { HolisticDevelopmentCard } from "./components/HolisticDevelopmentCard";
import { AttendanceRecordCard } from "./components/AttendanceRecordCard";
import { FormalReportTemplate } from "./components/FormalReportTemplate";
import { TermTabs } from "./components/TermTabs";
// import { useFormalReportDownload } from "./hooks/useFormalreportDownload";
import type { DetailStudent } from "../GlobalTypes/types";

interface ProgressReportTabProps {
  theme: AdminThemeContext;
  student: DetailStudent;
}

export function ProgressReportContent({
  theme,
  student,
}: ProgressReportTabProps) {
  const {
    data,
    selectedTerm,
    setSelectedTerm,
    currentHolisticAssessment,
    currentAttendance,
  } = useProgressReport();
  const { darkMode, textPrimary } = theme;

  // const { downloading, handleDownload } = useFormalReportDownload({
  //   elementId: "formal-progress-report",
  //   fileName: `${data.meta.learner}-progress-report.pdf`,
  // });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className={`text-[10px] font-semibold uppercase tracking-wide ${theme.textMuted}`}
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
        <PeriodicRatingCard
          rows={data.periodicRatings}
          termAverages={data.termAverages}
          theme={theme}
          student={student}
        />

        <TermAverageCard
          entries={data.termAverages}
          selectedTerm={selectedTerm}
          theme={theme}
          student={student}
        />
      </div>

      <HolisticDevelopmentCard
  assessment={currentHolisticAssessment}
  selectedTerm={selectedTerm}
  theme={theme}
  student={student}
/>

      <AttendanceRecordCard
        record={currentAttendance}
        theme={theme}
        student={student}
      />

      {/* Hidden off-screen template used by generateFormalPDF */}
      <FormalReportTemplate data={data} />
    </div>
  );
}

export default function ProgressReportTab({
  theme,
  student,
}: ProgressReportTabProps) {
  return <ProgressReportContent theme={theme} student={student} />;
}
