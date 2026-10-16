import { ProfileOverviewCard } from "@shared/components/ProfileOverviewCard";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { getTeacherAvatar,getTeacherAvatarBorderColor } from "@shared/profile/utils/teacherAvatar";
import { UserRound } from "lucide-react";
import { useState,type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { BackButton } from "../../../shared/components/DashboardUI";
import { getClassList } from "../students/services/students.service";
import { ScheduleByDay } from "./components/ScheduleByDay";
import { TeacherClassListHeader } from "./components/TeacherClassListHeader";
import { TeacherClassRosters,type TeacherClassRoster } from "./components/TeacherClassRosters";
import { TeacherNotFound } from "./components/TeacherNotFound";
import type { TeacherProfile } from "./data/types";
import { useTeacherSchedule } from "./hooks/useTeacherSchedule";
import { groupScheduleByDay } from "./utils/schedule";

interface TeacherSchedulePageProps {
  teacherIdOverride?: string;
  backPath?: string;
  headerActions?: ReactNode;
  prerequisite?: { loading: boolean; error: unknown; retry: () => void };
  serverState?: {
    schedule: ReturnType<typeof useTeacherSchedule>;
    classRosters: TeacherClassRoster[];
    rostersLoading: boolean;
    rostersError: boolean;
    retryRosters: () => void;
    offline: boolean;
  };
}

function useTeacherSchedulePageState({ teacherIdOverride, backPath = "/principal/teachers", headerActions, prerequisite, serverState }: TeacherSchedulePageProps, schedule: ReturnType<typeof useTeacherSchedule>) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { teacherId: routeTeacherId } = useParams<{ teacherId: string }>();

  const id = teacherIdOverride ?? (routeTeacherId ? decodeURIComponent(routeTeacherId) : "");
  const { teacher, schoolYear, notFound } = schedule;
  const loading = !!prerequisite?.loading || schedule.loading;
  const error = prerequisite?.error || schedule.error;
  const retry = prerequisite?.error ? prerequisite.retry : schedule.retry;
  const [activeTab, setActiveTab] = useState<"schedule" | "class-list">("class-list");
  const [localRosters, setClassRosters] = useState<TeacherClassRoster[]>([]);
  const [localLoading, setRostersLoading] = useState(false);
  const [localError, setRostersError] = useState(false);
  const [rosterAttempt, setRosterAttempt] = useState(0);
  const classRosters = serverState?.classRosters ?? localRosters;
  const rostersLoading = serverState?.rostersLoading ?? localLoading;
  const rostersError = serverState?.rostersError ?? localError;
  const offline = !!serverState?.offline && !prerequisite?.error;
  const blockingError = error && !(offline && teacher);

  if (!loading && (!error || offline) && (notFound || (!error && !teacher))) {
    return { content: (<>{offline && <LoadingRegion loading={false} error={error} retry={retry} skeleton={null}>{null}</LoadingRegion>}<TeacherNotFound panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} /></>), scope: { teacher, setClassRosters, setRostersLoading, setRostersError, getClassList, rosterAttempt } };
  }
  const profile: TeacherProfile = teacher ?? { teacherId: id, fullName: "", gender: null, advisorySection: null, gradeLevel: null, room: null, advisories: [], schedule: [] };
  const scheduleByDay = groupScheduleByDay(profile.schedule);
  const totalSubjects = new Set(profile.schedule.map((entry) => entry.subject.trim()).filter(Boolean)).size;
  const initials = profile.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const teacherAvatar = getTeacherAvatar(profile);
  const teacherAvatarBorderColor = getTeacherAvatarBorderColor(profile.gender);
  const advisory = profile.advisories?.length
    ? `${profile.advisories.length} assigned ${profile.advisories.length === 1 ? "class" : "classes"}`
    : profile.gradeLevel || profile.advisorySection
      ? `${profile.gradeLevel ?? ""}${profile.gradeLevel && profile.advisorySection ? " · " : ""}${profile.advisorySection ?? ""}`
      : "No advisory assigned";

  return { content: ((
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-start gap-2.5">
        <BackButton onClick={() => navigate(backPath)} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-maroon" data-sk-region="teacherschedulepage-teachers" data-sk-static="">Teachers</p>
            <h1 className={`qed-type-page-title mt-1 ${textPrimary}`} data-sk-region="teacherschedulepage-teacher-profile" data-sk-static="">Teacher Profile</h1>
          </div>
          {headerActions}
        </div>
      </div>

      {error && <LoadingRegion loading={false} error={error} retry={retry} skeleton={null}>{null}</LoadingRegion>}
      {!blockingError && <><ProfileOverviewCard
        loading={loading}
        fieldKey={`teacher-profile:${id}`}
        label={`${profile.fullName} teacher profile`}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        avatarBorderColor={teacherAvatarBorderColor}
        avatar={teacherAvatar ? <img src={teacherAvatar} alt={`${profile.fullName} profile`} className="h-full w-full object-cover" /> : initials || <UserRound className="h-9 w-9" />}
        name={profile.fullName}
        subtitle={`Teacher · School Year ${schoolYear}`}
        subtitlePrefix="Teacher · School Year "
        stats={[
          { label: "Advisory", value: advisory },
          { label: "Room", value: profile.room || "Not assigned" },
          { label: "Total subjects", value: totalSubjects },
        ]}
        tabs={[
          { id: "schedule", label: "Class schedule" },
          { id: "class-list", label: "Class list", count: classRosters.length },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as "schedule" | "class-list")}
      />

      {activeTab === "schedule" ? (
        <div id="teacher-schedule-panel" role="tabpanel" aria-label="Class schedule">
          <ScheduleByDay
            scheduleByDay={scheduleByDay}
            loading={loading}
            view={`teacher-schedule:${id}`}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />
        </div>
      ) : (
        <div id="teacher-class-list-panel" role="tabpanel" aria-label="Class list" className="flex flex-col gap-3">
          <TeacherClassListHeader
            sectionCount={classRosters.length}
            loading={loading || rostersLoading}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />
          <TeacherClassRosters
            rosters={classRosters}
            loading={loading || rostersLoading}
            view={`teacher-rosters:${id}`}
            retry={serverState?.retryRosters ?? (() => setRosterAttempt(value => value + 1))}
            error={rostersError}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />
        </div>
      )}</>}
    </div>
  )), scope: { teacher, setClassRosters, setRostersLoading, setRostersError, getClassList, rosterAttempt } };
}



export type TeacherSchedulePageEffectScope = ReturnType<typeof useTeacherSchedulePageState>["scope"];
export type TeacherSchedulePageRouteProps = Parameters<typeof useTeacherSchedulePageState>[0];
type CompositionProps = TeacherSchedulePageRouteProps & { effects?: (scope: TeacherSchedulePageEffectScope) => import("react").ReactNode };
export function TeacherSchedulePageComposition(props: CompositionProps = {}) {
 return props.serverState
   ? <TeacherScheduleContent {...props} schedule={props.serverState.schedule} />
   : <LegacyTeacherScheduleContent {...props} />;
}

// Admin keeps its existing hook/effects and never imports Principal Query code.
function LegacyTeacherScheduleContent(props: CompositionProps) {
 const { teacherId } = useParams<{ teacherId: string }>();
 const id = props.teacherIdOverride ?? (teacherId ? decodeURIComponent(teacherId) : "");
 const schedule = useTeacherSchedule(id, !props.prerequisite?.loading && !props.prerequisite?.error);
 return <TeacherScheduleContent {...props} schedule={schedule} />;
}

function TeacherScheduleContent(props: CompositionProps & { schedule: ReturnType<typeof useTeacherSchedule> }) {
 const state = useTeacherSchedulePageState(props, props.schedule);
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
