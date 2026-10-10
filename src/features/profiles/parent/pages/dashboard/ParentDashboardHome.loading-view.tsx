import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { useAuth } from "../../../../auth/context/authContext"; // adjust path kung iba sa project mo
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import DailyUpdateCard from "../dashboard/components/DailyUpdateCard";
import EventsCard from "../dashboard/components/EventsCard";
import OnboardingCarousel from "../dashboard/components/OnboadingCarousel";
import StudentsSection from "../dashboard/components/StudentsSection";
import TodayDateCard from "../dashboard/components/TodayDateCard";
import WelcomeBanner from "../dashboard/components/WelcomeBanner";
import { useParentDashboard } from "./context/ParentDashboardContext";

interface ParentOutletContext extends AdminThemeContext {
  openLinkModal: () => void;
}

function useParentDashboardHomeState() {
  const {
    darkMode,
    panelBg,
    panelBorder,
    textPrimary,
    textMuted,
    openLinkModal,
  } = useOutletContext<ParentOutletContext>();

  const { students, viewMode, setViewMode, isLoadingStudents, studentsError, refetchStudents } = useParentDashboard();
  const { dailyUpdates, isLoadingDailyUpdates, dailyUpdatesError, refetchDailyUpdates } = useParentDashboard();

  const { user } = useAuth();

  const now = new Date();
  const TODAY = {
    day: now.getDate(),
    month: now.toLocaleString("en-US", { month: "long" }),
    year: now.getFullYear(),
  };

  return { content: ((
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
      {/* Row 1: banner + date card share the same height */}
      <WelcomeBanner
        parentName={user?.name ?? "Parent"}
        loadingStudents={isLoadingStudents} loadingNotices={isLoadingDailyUpdates}
        childrenCount={students.length}
        noticesCount={dailyUpdates.length}
        onLinkStudent={openLinkModal}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />

      <div className="flex h-full flex-col [&>*]:flex-1">
        <TodayDateCard {...TODAY} panelBg={panelBg} textMuted={textMuted} />
      </div>

      {/* Row 2: left column */}
      <div className="flex flex-col gap-6">
        <OnboardingCarousel darkMode={darkMode} />

        <StudentsSection
          students={students}
          loading={isLoadingStudents} error={studentsError} retry={refetchStudents}
          view={viewMode}
          onViewChange={setViewMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          darkMode={darkMode}
        />
      </div>

      {/* Row 2: right column */}
      <div className="flex flex-col gap-6 xl:self-start">
        <DailyUpdateCard
          updates={dailyUpdates}
          isLoading={isLoadingDailyUpdates}
          error={dailyUpdatesError} retry={refetchDailyUpdates}
          panelBg={panelBg}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
        <EventsCard
          panelBg={panelBg}
          textPrimary={textPrimary}
          textMuted={textMuted}
          darkMode={darkMode}
        />
      </div>
    </div>
  )), scope: {  } };
}



export type ParentDashboardHomeEffectScope = ReturnType<typeof useParentDashboardHomeState>["scope"];
export type ParentDashboardHomeRouteProps = Record<string, never>;
export function ParentDashboardHomeComposition(props: object & { effects?: (scope: ParentDashboardHomeEffectScope) => import("react").ReactNode }) {
 const state = useParentDashboardHomeState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
