import type { AdminThemeContext } from "../../../../../profiles/admin/pages/AdminLayout";
import { useProgressReport } from "./context/ProgressReportContext";
import { PeriodicRatingCard } from "./components/PeriodicRatingCard";
import { TermAverageCard } from "./components/QuarterlyAverageCard";
import { HolisticDevelopmentCard } from "./components/HolisticDevelopmentCard";
import { AttendanceRecordCard } from "./components/AttendanceRecordCard";
import { FormalReportTemplate } from "./components/FormalReportTemplate";
import { TermTabs } from "./components/TermTabs";
import type { DetailStudent } from "../GlobalTypes/types";
import type {ReactNode} from 'react';
import type {ReaderValue} from '../../../query/drivers/ProgressReportQueries';

function ReportSection({label,state,children}:{label:string;state:ReaderValue['sections']['academic'];children:ReactNode}) {
  return <section aria-label={label}>
    {state.error&&<div role="alert" className="py-3 text-sm"><p>{label} {state.hasData?'could not be refreshed. Previously retrieved data is shown.':'are unavailable.'} {state.error}</p><button type="button" onClick={state.retry} className="mt-2 font-semibold underline">Retry</button></div>}
    {(!state.error||state.hasData)&&children}
  </section>;
}

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
    sections,
    complete,
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

      <ReportSection label="Academic results" state={sections.academic}><div className="flex flex-col gap-4 lg:flex-row">
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
      </div></ReportSection>

      <ReportSection label="Holistic assessments" state={sections.holistic}><HolisticDevelopmentCard loading={loading||sections.holistic.loading&&!sections.holistic.hasData}
        assessment={currentHolisticAssessment}
        selectedTerm={selectedTerm}
        theme={theme}
        student={student}
      /></ReportSection>

      <ReportSection label="Attendance records" state={sections.attendance}><AttendanceRecordCard loading={loading||sections.attendance.loading&&!sections.attendance.hasData}
        record={currentAttendance}
        theme={theme}
        student={student}
      /></ReportSection>

      {/* Hidden off-screen template used by generateFormalPDF */}
      {complete&&<FormalReportTemplate data={data} />}
    </div>
  );
}

export default function ProgressReportTab({ theme, student, loading = false }: ProgressReportTabProps) {
  return <ProgressReportContent theme={theme} student={student} loading={loading} />;
}
