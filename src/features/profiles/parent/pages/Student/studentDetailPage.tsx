import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import AttendanceOverview from "./Overview/components/AttendanceOverview";
import PerformanceAnalytics from "./Overview/components/PerformanceAnalytics";
import HolisticAnalytics from "./Overview/components/HolisticAnalytics";
import AcademicTab from "./Academic/AcademicTab";
import {
  mockMissedActivities,
  mockInterventionFlags,
  mockSchedule,
} from "./Academic/data/MockData";
import { TabNav, type StudentDetailTab } from "./PageComponents/TopNavigation";
import StudentInfoTable from "./PageComponents/StudentInfoTable";
import { useStudentDetail } from "./Overview/useStudentDetail";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import ProgressReportTab from "./ProgressReport/ProgessReportTab";
import {
  ProgressReportProvider,
  useProgressReport,
} from "./ProgressReport/context/ProgressReportContext";
import { useFormalReportDownload } from "./ProgressReport/hooks/useFormalreportDownload";
import type { DetailStudent } from "./GlobalTypes/types";
import {StudentProfileTab} from "./StudentProfile/StudentProfileTab";

// Small inner component so it can consume ProgressReportContext
function ProgressReportSection({
  theme,
  student,
}: {
  theme: AdminThemeContext;
  student: DetailStudent;
}) {
  const { data } = useProgressReport();
  const { downloading, handleDownload } = useFormalReportDownload({
    elementId: "formal-progress-report",
    fileName: `${data.meta.learner}-progress-report.pdf`,
  });

  return (
    <>
  <div className="flex flex-col gap-1 mt-4 mb-2">
    <h1 className={`text-lg font-bold ${theme.textPrimary}`}>
      Progess Report
    </h1>
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <p className={`text-sm ${theme.textMuted} self-start sm:self-auto`}>
        Monitor your child's class performance, attendance, and holistic
        development across all quarters.
      </p>

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#8B0D0D] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        <Download size={14} /> {downloading ? "Preparing…" : "Download PDF"}
      </button>
    </div>
  </div>

  <StudentInfoTable student={student} theme={theme} />
  <ProgressReportTab theme={theme} student={student} />
</>
  );
}

export default function StudentDetailPage() {
  const navigate = useNavigate();
  const { student, studentId } = useStudentDetail();
  const [activeTab, setActiveTab] = useState<StudentDetailTab>("overview");
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, textMuted } = theme;

  useEffect(() => {
    setActiveTab("overview");
  }, [studentId]);

  if (!student) {
    return (
      <div
        className={`flex min-h-screen w-full flex-col items-center justify-center gap-3 ${darkMode ? "bg-[#0B1120]" : ""}`}
      >
        <p className={`text-sm font-semibold ${textMuted}`}>
          We couldn't find a student with ID "{studentId}".
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`flex items-center gap-1.5 text-xs font-semibold ${textMuted} hover:opacity-80`}
        >
          <ArrowLeft size={14} /> Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full py-4">
        <div className="mb-4">
          <TabNav
            active={activeTab}
            onChange={setActiveTab}
            darkMode={darkMode}
            textPrimary={theme.textPrimary}
            textMuted={textMuted}
          />
        </div>

        <div className="flex flex-col gap-4">
          {activeTab === "overview" && (
            <>
              <div className="flex flex-col gap-1 mt-4 mb-2">
                <h1 className={`text-lg font-bold ${theme.textPrimary}`}>
                  Overview
                </h1>
                <p className={`text-sm ${textMuted}`}>
                  A quick summary of monthly attendance, academic performance,
                  and holistic development.
                </p>
              </div>
              <StudentInfoTable student={student} theme={theme} />
              <AttendanceOverview student={student} theme={theme} />
              <div className="flex flex-col gap-4 sm:flex-row">
                <PerformanceAnalytics student={student} theme={theme} />
                <HolisticAnalytics student={student} theme={theme} />
              </div>
            </>
          )}

          {activeTab === "academic" && (
            <>
              <div className="flex flex-col gap-1 mt-4 mb-2">
                <h1 className={`text-lg font-bold ${theme.textPrimary}`}>
                  Aademic Support
                </h1>
                <p className={`text-sm ${textMuted}`}>
                  Monitor your child's class schedule, keep track of missed
                  assignments, and access personalized learning support.
                </p>
              </div>
              <StudentInfoTable student={student} theme={theme} />
              <AcademicTab
                missedActivities={mockMissedActivities}
                interventionFlags={mockInterventionFlags}
                schedule={mockSchedule}
                theme={theme}
                student={student}
              />
            </>
          )}

          {activeTab === "progressReport" && (
            <ProgressReportProvider>
              <ProgressReportSection theme={theme} student={student} />
            </ProgressReportProvider>
          )}

          {activeTab === "studentProfile" && (
            <>
              <StudentProfileTab student={student} theme={theme} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
