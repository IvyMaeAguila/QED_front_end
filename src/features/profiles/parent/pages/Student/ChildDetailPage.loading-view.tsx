import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { ArrowLeft,Download } from "lucide-react";
import { useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import AcademicTab from "./Academic/AcademicTab";
import type { DetailStudent } from "./GlobalTypes/types";
import HolisticTab from "./Holistic/HoisticWeeklyReportTab";
import AttendanceOverview from "./Overview/components/AttendanceOverview";
import StudentNarrativeSnapshot from "./Overview/components/HolisticAverage";
import TermAverageTrendChart from "./Overview/components/PerformanceAnalytics";
import { useStudentDetail } from "./Overview/useStudentDetail";
import StudentInfoTable from "./PageComponents/StudentInfoTable";
import { TabNav,type StudentDetailTab } from "./PageComponents/TopNavigation";
import ProgressReportTab from "./ProgressReport/ProgessReportTab";
import {
ProgressReportProvider,
useProgressReport,
} from "./ProgressReport/context/ProgressReportContext";
import { useFormalReportDownload } from "./ProgressReport/hooks/useFormalreportDownload";
import ProgressReportUnavailableModal from "./ProgressReport/utils/ProgressReportUnavailableModal";
import { StudentProfileTab } from "./StudentProfile/StudentProfileTab";

// Small inner component so it can consume ProgressReportContext
function ProgressReportSection({
  theme,
  student,
}: {
  theme: AdminThemeContext;
  student: DetailStudent;
}) {
  const { data, loading, error, refetch, selectedTerm, selectedTermVisibility } = useProgressReport();
  const { downloading, handleDownload } = useFormalReportDownload({
    elementId: "formal-progress-report",
    fileName: `${data.meta.learner}-progress-report.pdf`,
  });

  const isLocked = !(selectedTermVisibility?.available ?? false);

  const [modalOpen, setModalOpen] = useState(false);

  // Unavailable terms settle normally; the modal explains access after loading.
  useEffect(() => {
    if (loading) {
      setModalOpen(false);
      return;
    }
    setModalOpen(isLocked);
  }, [loading, isLocked, selectedTerm]);

  function handleModalClose() {
    setModalOpen(false);
  }


  return (
    <>
      <div className="flex flex-col gap-1 mt-4 mb-2">
        <h1 className={`qed-type-page-title ${theme.textPrimary}`}>
          Progess Report
        </h1>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className={`qed-type-page-description self-start sm:self-auto ${theme.textMuted}`}>
            Monitor your child's class performance, attendance, and holistic
            development across all quarters.
          </p>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || loading || isLocked || !!error}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-maroon px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Download size={14} /> {downloading ? "Preparing…" : "Download PDF"}
          </button>
        </div>
      </div>

      <StudentInfoTable student={student} theme={theme} />
      <LoadingRegion name="parent-progress-report" loading={loading} error={error} retry={refetch} variable skeleton={null} frame={(pending) => !pending && isLocked ? <p className={`py-6 text-sm ${theme.textMuted}`}>This progress report is not available yet.</p> : <ProgressReportTab theme={theme} student={student} loading={pending} />}>{null}</LoadingRegion>
      {!loading && !error && isLocked && <ProgressReportUnavailableModal open={modalOpen} onClose={handleModalClose} theme={theme} isVisible={selectedTermVisibility?.isVisible ?? false} termEnded={selectedTermVisibility?.termEnded ?? false} />}
    </>
  );
}

function useChildDetailPageState() {
  const navigate = useNavigate();
  const { student, studentId, loading: identityLoading, error: identityError, retry: retryIdentity } = useStudentDetail()
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, textMuted } = theme;

  const currentTerm = 1;

 const location = useLocation();
const [searchParams] = useSearchParams();

const requestedTab =
  (location.state as { tab?: StudentDetailTab } | null)?.tab ??
  (searchParams.get("tab") as StudentDetailTab | null) ??
  undefined;

const [activeTab, setActiveTab] = useState<StudentDetailTab>(
  requestedTab ?? "overview"
);

  if ((!student && !identityLoading && !identityError) || !studentId) {
    return { content: ((
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
    )), scope: { setActiveTab, requestedTab, studentId, location } };
  }

  const detailStudent: DetailStudent = student ?? { id: studentId!, firstName: "", fullName: "", gradeLevel: "", section: "", adviser: "", schoolYear: "2026 - 2027" };
  return { content: ((
    <div className="w-full">
      <div className="w-full">
        <div className="mb-4">
          <TabNav
            active={activeTab}
            onChange={setActiveTab}
            darkMode={darkMode}
            textPrimary={theme.textPrimary}
            textMuted={textMuted}
          />
        </div>

        <LoadingRegion name="parent-student-identity" loading={identityLoading} error={identityError} retry={retryIdentity} variable skeleton={<StudentInfoTable student={detailStudent} theme={theme} loading />} >
        {student && <>
        <div className="flex flex-col gap-4">
          {activeTab === "overview" && (
            <ProgressReportProvider studentId={studentId}>
              <div className="flex flex-col gap-1 mt-4 mb-2">
                <h1 className={`qed-type-page-title ${theme.textPrimary}`}>
                  Overview
                </h1>
                <p className={`qed-type-page-description ${textMuted}`}>
                  A quick summary of monthly attendance, academic performance,
                  and holistic development.
                </p>
              </div>
              <StudentInfoTable student={student} theme={theme} />
              <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
                <div className="min-w-0">
                  <AttendanceOverview student={student} theme={theme} />
                </div>
                <div className="min-w-0">
                  <TermAverageTrendChart student={student} theme={theme} />
                </div>
              </div>
              <StudentNarrativeSnapshot student={student} theme={theme} />
            </ProgressReportProvider>
          )}
          {activeTab === "academic" && (
            <>
              <div className="flex flex-col gap-1 mt-4 mb-2">
                <h1 className={`qed-type-page-title ${theme.textPrimary}`}>
                  Aademic Support
                </h1>
                <p className={`qed-type-page-description ${textMuted}`}>
                  Monitor your child's class schedule, keep track of missed
                  assignments, and access personalized learning support.
                </p>
              </div>
              <StudentInfoTable student={student} theme={theme} />
              <AcademicTab
                theme={theme}
                student={student}
              />
            </>
          )}

          {activeTab === "holistic" && (
            <>
              <div className="flex flex-col gap-1 mt-4 mb-2">
                <h1 className={`qed-type-page-title ${theme.textPrimary}`}>
                  Holistic Development
                </h1>
                <p className={`qed-type-page-description ${textMuted}`}>
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
              />
            </ProgressReportProvider>
          )}

          {activeTab === "studentProfile" && (
            <>
              <StudentProfileTab student={student} theme={theme} />
            </>
          )}
        </div>
        </>}
        </LoadingRegion>
      </div>
    </div>
  )), scope: { setActiveTab, requestedTab, studentId, location } };
}


export type ChildDetailPageEffectScope = ReturnType<typeof useChildDetailPageState>["scope"];
export type ChildDetailPageRouteProps = Record<string, never>;
export function ChildDetailPageComposition(props: object & { effects?: (scope: ChildDetailPageEffectScope) => import("react").ReactNode }) {
 const state = useChildDetailPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
