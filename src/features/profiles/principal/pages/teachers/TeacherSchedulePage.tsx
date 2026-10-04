import { useEffect, useState, type ReactNode } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { BackButton } from "../../../shared/components/DashboardUI";
import { UserRound } from "lucide-react";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useTeacherSchedule } from "./hooks/useTeacherSchedule";
import { groupScheduleByDay } from "./utils/schedule";
import { ScheduleByDay } from "./components/ScheduleByDay";
import { TeacherClassRosters, type TeacherClassRoster } from "./components/TeacherClassRosters";
import { TeacherClassListHeader } from "./components/TeacherClassListHeader";
import { TeacherNotFound } from "./components/TeacherNotFound";
import { getClassList } from "../students/services/students.service";
import { getTeacherAvatar, getTeacherAvatarBorderColor } from "@shared/profile/utils/teacherAvatar";
import { ProfileOverviewCard } from "@shared/components/ProfileOverviewCard";

interface TeacherSchedulePageProps {
  teacherIdOverride?: string;
  backPath?: string;
  headerActions?: ReactNode;
}

export function TeacherSchedulePage({ teacherIdOverride, backPath = "/principal/teachers", headerActions }: TeacherSchedulePageProps = {}) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { teacherId: routeTeacherId } = useParams<{ teacherId: string }>();

  const id = teacherIdOverride ?? (routeTeacherId ? decodeURIComponent(routeTeacherId) : "");
  const { teacher, schoolYear, loading, notFound } = useTeacherSchedule(id);
  const [activeTab, setActiveTab] = useState<"schedule" | "class-list">("class-list");
  const [classRosters, setClassRosters] = useState<TeacherClassRoster[]>([]);
  const [rostersLoading, setRostersLoading] = useState(false);
  const [rostersError, setRostersError] = useState(false);

  useEffect(() => {
    let active = true;
    const classes = new Map<number, { gradeSection: string | null; room: string | null }>();
    for (const advisoryClass of teacher?.advisories ?? []) {
      const classId = Number(advisoryClass.classId);
      if (Number.isInteger(classId) && classId > 0 && !classes.has(classId)) {
        classes.set(classId, {
          gradeSection: `${advisoryClass.gradeLevel ?? ""} · ${advisoryClass.section ?? ""}`,
          room: advisoryClass.room,
        });
      }
    }

    if (!teacher || classes.size === 0) {
      setClassRosters([]);
      setRostersLoading(false);
      setRostersError(false);
      return () => { active = false; };
    }

    setRostersLoading(true);
    setRostersError(false);
    Promise.all(
      [...classes.entries()].map(async ([classId, scheduledClass]) => {
        try {
          const classList = await getClassList(classId);
          if (!classList) return { roster: null, failed: true };
          const sectionLabel = `${classList.grade} · ${classList.sectionInfo.section}`;
          return {
            failed: false,
            roster: {
              classId,
              sectionLabel: sectionLabel.trim() || scheduledClass.gradeSection || "Section not assigned",
              room: scheduledClass.room || classList.sectionInfo.room,
              students: classList.roster,
            } satisfies TeacherClassRoster,
          };
        } catch (error) {
          console.error(`Failed to load class roster ${classId}:`, error);
          return { roster: null, failed: true };
        }
      }),
    ).then((results) => {
      if (!active) return;
      setClassRosters(results.flatMap((result) => result.roster ? [result.roster] : []));
      setRostersError(results.some((result) => result.failed));
    }).finally(() => {
      if (active) setRostersLoading(false);
    });

    return () => { active = false; };
  }, [teacher?.teacherId, teacher?.schedule, teacher?.advisories]);

  if (loading) {
    return <p className={`text-sm ${textMuted}`}>Loading schedule…</p>;
  }

  if (notFound || !teacher) {
    return <TeacherNotFound panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} />;
  }

  const scheduleByDay = groupScheduleByDay(teacher.schedule);
  const totalSubjects = new Set(teacher.schedule.map((entry) => entry.subject.trim()).filter(Boolean)).size;
  const initials = teacher.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const teacherAvatar = getTeacherAvatar(teacher);
  const teacherAvatarBorderColor = getTeacherAvatarBorderColor(teacher.gender);
  const advisory = teacher.advisories?.length
    ? `${teacher.advisories.length} assigned ${teacher.advisories.length === 1 ? "class" : "classes"}`
    : teacher.gradeLevel || teacher.advisorySection
      ? `${teacher.gradeLevel ?? ""}${teacher.gradeLevel && teacher.advisorySection ? " · " : ""}${teacher.advisorySection ?? ""}`
      : "No advisory assigned";

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-start gap-2.5">
        <BackButton onClick={() => navigate(backPath)} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-maroon">Teachers</p>
            <h1 className={`mt-1 text-xl font-black tracking-tight ${textPrimary}`}>Teacher Profile</h1>
          </div>
          {headerActions}
        </div>
      </div>

      <ProfileOverviewCard
        label={`${teacher.fullName} teacher profile`}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        avatarBorderColor={teacherAvatarBorderColor}
        avatar={teacherAvatar ? <img src={teacherAvatar} alt={`${teacher.fullName} profile`} className="h-full w-full object-cover" /> : initials || <UserRound className="h-9 w-9" />}
        name={teacher.fullName}
        subtitle={`Teacher · School Year ${schoolYear}`}
        stats={[
          { label: "Advisory", value: advisory },
          { label: "Room", value: teacher.room || "Not assigned" },
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
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />
          <TeacherClassRosters
            rosters={classRosters}
            loading={rostersLoading}
            error={rostersError}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
          />
        </div>
      )}
    </div>
  );
}
