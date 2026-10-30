import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { lastKnownCount, rememberRows, skeletonRows } from "@shared/loading/reservations";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useStudents } from "../../../admin/pages/studentrecords/context/StudentsContext";
import type { Student } from "../../../admin/pages/studentrecords/types/Students";
import { fetchGradingPeriodsGlobal, fetchStudentHolisticProfile, type StudentHolisticProfile } from "./services/holistic.service";
import { StudentHolisticProfileContent } from "./StudentHolisticProfileContent";
import "./StudentHolisticProfile.print.css";

const ACCENT = "var(--brand-primary)";

function useStudentHolisticProfilePageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const { studentId } = useParams<{ studentId: string }>();
  const { getStudent, loading: studentLoading, error: studentError, refetch: retryStudent } = useStudents();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [termNumber, setTermNumber] = useState<number | null>(
    searchParams.get("term") ? Number(searchParams.get("term")) : null,
  );
  const [attempt, setAttempt] = useState(0);
  const [termsAttempt, setTermsAttempt] = useState(0);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [termsLoading, setTermsLoading] = useState(!searchParams.get("term"));
  const [profile, setProfile] = useState<StudentHolisticProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const student = studentId
    ? (getStudent(studentId) as Student | undefined)
    : undefined;

  const activeDomainAverages = useMemo(() => {
    if (!profile) return null;
    if (activeTab === "all") {
      return {
        domainAverages: profile.overall.domainAverages,
        evaluationCount: profile.overall.evaluationCount,
        lastEvaluation: profile.overall.lastEvaluation,
        riskLevel: profile.highestRiskLevel,
      };
    }
    const subj = profile.subjects.find((s) => s.subjectSectionId === activeTab);
    return subj
      ? {
          domainAverages: subj.domainAverages,
          evaluationCount: subj.evaluationCount,
          lastEvaluation: subj.lastEvaluation,
          riskLevel: subj.riskLevel,
        }
      : null;
  }, [profile, activeTab]);

  const subtleHover = darkMode ? "hover:bg-white/5" : "hover:bg-black/5";

  const combinedError = studentError || termsError || error;
  const dataLoading = !combinedError && (loading || termsLoading || (studentLoading && !student));
  const view = `holistic-profile-${studentId}-${termNumber ?? "default"}`;
  const retry = () => { if (studentError) void retryStudent(); if (termsError) setTermsAttempt(value => value + 1); if (error) setAttempt(value => value + 1); };
  const renderProfile = (pending: boolean) => {
    if (!pending && (!profile || !student)) return null;
    const data: StudentHolisticProfile = pending ? {studentId: studentId ?? "", studentName: "", isAdvisory: true, highestRiskLevel: "NONE", overall: {domainAverages: {cognitive: null, emotional: null, social: null, behavioral: null}, evaluationCount: 1, lastEvaluation: null}, subjects: Array.from({length: Math.min(lastKnownCount(view, 2), skeletonRows(view, undefined, 170))}, (_, index) => ({subjectSectionId: `pending-${index}`, subjectName: "", domainAverages: {cognitive: null, emotional: null, social: null, behavioral: null}, evaluationCount: 1, lastEvaluation: null, riskLevel: "NONE", risks: [], recommendations: [], weeksCount: 0, weeklyScores: [], pastAverage: null, recentAverage: null, currentWeekAverage: null, trend: "No Data"}))} : profile!;
    const averages = pending ? { ...data.overall, riskLevel: data.highestRiskLevel } : activeDomainAverages;
    return <StudentHolisticProfileContent data={data} student={student} pending={pending} activeTab={activeTab} onSelectSubject={setActiveTab} averages={averages} darkMode={darkMode} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} />;
  };

  return { content: ((
    <div data-student-holistic-profile className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className={`system-back-button print:hidden mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${panelBorder} ${textMuted} ${subtleHover} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
          style={{ ["--tw-ring-color" as string]: ACCENT }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>

          <h1 className={`qed-type-page-title ${textPrimary}`}>Holistic Development Profile</h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
                Current state, growth over the term, and a per-domain breakdown by subject.
              </p>
        </div>
      </div>
      </div>

      <LoadingRegion loading={dataLoading} error={combinedError} retry={retry} name="holistic-profile-data" variable skeleton={null} frame={renderProfile} onSettled={() => rememberRows(view, profile?.subjects.length ?? 0)}>{null}</LoadingRegion>

    </div>
  )), scope: { termNumber, termsAttempt, setTermsLoading, setTermsError, fetchGradingPeriodsGlobal, setTermNumber, studentId, setLoading, setError, fetchStudentHolisticProfile, setProfile, attempt } };
}

export type StudentHolisticProfilePageEffectScope = ReturnType<typeof useStudentHolisticProfilePageState>["scope"];
export type StudentHolisticProfilePageRouteProps = Record<string, never>;
export function StudentHolisticProfilePageComposition(props: object & { effects?: (scope: StudentHolisticProfilePageEffectScope) => import("react").ReactNode }) {
 const state = useStudentHolisticProfilePageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
