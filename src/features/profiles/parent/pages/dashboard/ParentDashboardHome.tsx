import { useOutletContext } from "react-router-dom";
import DailyUpdateCard from "../dashboard/components/DailyUpdateCard";
import EventsCard from "../dashboard/components/EventsCard";
import StudentsSection from "../dashboard/components/StudentsSection";
import TodayDateCard from "../dashboard/components/TodayDateCard";
import WelcomeBanner from "../dashboard/components/WelcomeBanner";
import OnboardingCarousel from "../dashboard/components/OnboadingCarousel";
import { useParentDashboard } from "./context/ParentDashboardContext";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useAuth } from "../../../../auth/context/authContext"; // adjust path kung iba sa project mo

interface ParentOutletContext extends AdminThemeContext {
  openLinkModal: () => void;
}

export default function ParentDashboardHome() {
  const {
    darkMode,
    panelBg,
    panelBorder,
    textPrimary,
    textMuted,
    openLinkModal,
  } = useOutletContext<ParentOutletContext>();

  const { students, viewMode, setViewMode } = useParentDashboard();
  const { dailyUpdates, isLoadingDailyUpdates } = useParentDashboard();

  const { user, isLoading: isProfileLoading } = useAuth();

  const now = new Date();
  const TODAY = {
    day: now.getDate(),
    month: now.toLocaleString("en-US", { month: "long" }),
    year: now.getFullYear(),
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
      {/* Row 1: banner + date card share the same height */}
      <WelcomeBanner
        parentName={isProfileLoading ? "..." : (user?.name ?? "Parent")}
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
  );
}
