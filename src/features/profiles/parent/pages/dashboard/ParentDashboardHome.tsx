import { useNavigate, useOutletContext } from "react-router-dom";
import DailyUpdateCard from "../dashboard/components/DailyUpdateCard";
import EventsCard from "../dashboard/components/EventsCard";
import StudentsSection from "../dashboard/components/StudentsSection";
import TodayDateCard from "../dashboard/components/TodayDateCard";
import WelcomeBanner from "../dashboard/components/WelcomeBanner";
import OnboardingCarousel from "../dashboard/components/OnboadingCarousel";
import { useParentDashboard } from "./context/ParentDashboardContext";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useAuth } from "../../../../auth/context/AuthContext"; // adjust path kung iba sa project mo

const TODAY = { day: 8, month: "August", year: 2026 };

interface ParentOutletContext extends AdminThemeContext {
  openLinkModal: () => void;
}

export default function ParentDashboardHome() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted, openLinkModal } =
    useOutletContext<ParentOutletContext>();
  const navigate = useNavigate();

  const { students, dailyUpdates, events, viewMode, setViewMode } =
    useParentDashboard();

  const { user, isLoading: isProfileLoading } = useAuth();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-5">
        <WelcomeBanner
          parentName={isProfileLoading ? "..." : (user?.name ?? "Parent")}
          childrenCount={students.length}
          noticesCount={dailyUpdates.length}
          onLinkStudent={openLinkModal}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          darkMode={darkMode}
        />

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

      <div className="flex flex-col gap-5">
        <TodayDateCard
          {...TODAY}
          panelBg={panelBg}
          textMuted={textMuted}
        />
        <DailyUpdateCard
          updates={dailyUpdates}
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