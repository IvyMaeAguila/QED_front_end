import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import AttendanceOverview from "./Overview/components/AttendanceOverview";
import TermAverageTrendChart from "./Overview/components/PerformanceAnalytics";
import StudentNarrativeSnapshot from "./Overview/components/HolisticAverage";
import AcademicTab from "./Academic/AcademicTab";
import HolisticTab from "./Holistic/HoisticWeeklyReportTab";
import { mockInterventionFlags, mockSchedule } from "./Academic/data/MockData";
import { TabNav, type StudentDetailTab } from "./PageComponents/TopNavigation";
import StudentInfoTable from "./PageComponents/StudentInfoTable";
import { useStudentDetail } from "./Overview/useStudentDetail";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import ProgressReportTab from "./ProgressReport/ProgessReportTab";
import {
  ProgressReportProvider,
  useProgressReport,
} from "./ProgressReport/context/ProgressReportContext";
import { TermPerformanceProvider } from "./Overview/context/PerformanceAnalyticsContext";
import { useFormalReportDownload } from "./ProgressReport/hooks/useFormalreportDownload";
import type { DetailStudent } from "./GlobalTypes/types";
import { StudentProfileTab } from "./StudentProfile/StudentProfileTab";
import { Skeleton } from "@shared/components/SkeletonLoading";
import ProgressReportUnavailableModal from "./ProgressReport/utils/ProgressReportUnavailableModal";

function ProgressReportSkeleton() {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <Skeleton className="h-6 w-40" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-8 w-35 rounded-lg" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="mb-5 h-24 w-full rounded-lg" />
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-18 rounded-lg" />
            <Skeleton className="h-8 w-18 rounded-lg" />
            <Skeleton className="h-8 w-18 rounded-lg" />
            <Skeleton className="h-8 w-18 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-5">
          <Skeleton className="h-60 w-180 rounded-lg" />
          <Skeleton className="h-60 w-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Small inner component so it can consume ProgressReportContext
function ProgressReportSection({
  theme,
  student,
  onUnavailableAcknowledge,
}: {
  theme: AdminThemeContext;
  student: DetailStudent;
  onUnavailableAcknowledge?: () => void;
}) {
  const { data, loading, selectedTerm, selectedTermVisibility } = useProgressReport();
  const { downloading, handleDownload } = useFormalReportDownload({
    elementId: "formal-progress-report",
    fileName: `${data.meta.learner}-progress-report.pdf`,
  });

  const isLocked = !(selectedTermVisibility?.available ?? false);

  const [modalOpen, setModalOpen] = useState(false);

  // Ipakita lang ang modal kapag TAPOS na ang loading AT locked pa rin ang term.
  // Ang buong section (heading, button, table) ay mananatiling skeleton
  // habang bukas ang modal na ito.
  useEffect(() => {
    if (loading) {
      setModalOpen(false);
      return;
    }
    setModalOpen(isLocked);
  }, [loading, isLocked, selectedTerm]);

  function handleModalClose() {
    setModalOpen(false);
    onUnavailableAcknowledge?.();
  }

  // Habang naglo-load PA, o naka-lock ang term (unavailable), manatiling
  // skeleton ang BUONG section — kasama ang heading, download button, at
  // StudentInfoTable — hindi lang yung mga card sa loob ng tab.
  if (loading || isLocked) {
    return (
      <>
        <ProgressReportSkeleton />
        {!loading && isLocked && (
          <ProgressReportUnavailableModal
            open={modalOpen}
            onClose={handleModalClose}
            theme={theme}
            isVisible={selectedTermVisibility?.isVisible ?? false}
            termEnded={selectedTermVisibility?.termEnded ?? false}
          />
        )}
      </>
    );
  }

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

export default function ChildDetailPage() {
  const navigate = useNavigate();
  const { student, studentId } = useStudentDetail();
  const [activeTab, setActiveTab] = useState<StudentDetailTab>("overview");
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, textMuted } = theme;

  const currentTerm = 1;

  useEffect(() => {
    setActiveTab("overview");
  }, [studentId]);

  if (!student || !studentId) {
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
            <ProgressReportProvider studentId={studentId}>
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
              <div className="flex flex-col gap-4 sm:flex-row items-stretch h-[320px] sm:h-[280px]">
                <div className="sm:w-1/2 sm:flex-1 sm:basis-0 min-h-0">
                  <TermAverageTrendChart student={student} theme={theme} />
                </div>
                <div className="sm:w-1/2 sm:flex-1 sm:basis-0 min-h-0">
                  <StudentNarrativeSnapshot student={student} theme={theme} />
                </div>
              </div>
            </ProgressReportProvider>
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
                interventionFlags={mockInterventionFlags}
                schedule={mockSchedule}
                theme={theme}
                student={student}
              />
            </>
          )}

          {activeTab === "holistic" && (
            <>
              <div className="flex flex-col gap-1 mt-4 mb-2">
                <h1 className={`text-lg font-bold ${theme.textPrimary}`}>
                  Holistic Development
                </h1>
                <p className={`text-sm ${textMuted}`}>
                  Track your child's cognitive, emotional, social, and
                  behavioral development across every subject.
                </p>
              </div>
              <StudentInfoTable student={student} theme={theme} />
              <HolisticTab
                key={currentTerm}
                termKey={currentTerm}
                theme={theme}
                student={student}
              />
            </>
          )}

          {activeTab === "progressReport" && (
            <ProgressReportProvider studentId={studentId}>
              <ProgressReportSection
                theme={theme}
                student={student}
                onUnavailableAcknowledge={() => setActiveTab("overview")}
              />
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