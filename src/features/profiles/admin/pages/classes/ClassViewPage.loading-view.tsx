import { SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { rememberColumns,rememberRows,skeletonRows,useColumnReservation } from "@shared/loading/reservations";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { ArrowLeft,Mail,Pencil,Phone,UserRound } from "lucide-react";
import { useRef,useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { ProfileOverviewCard } from "../../../../../shared/components/ProfileOverviewCard";
import { StudentDirectory } from "../../../../../shared/components/StudentDirectory";
import { getTeacherAvatar,getTeacherAvatarBorderColor } from "../../../../../shared/profile/utils/teacherAvatar";
import { BackButton } from "../../../shared/components/DashboardUI";
import type { AdminThemeContext } from "../AdminLayout";
import { useStudents } from "../studentrecords/context/StudentsContext";
import { formatFullName } from "../studentrecords/types/Students";
import { useClasses } from "./context/ClassesContext";
import { useTeachers } from "./context/TeachersContext";
import { DAYS_OF_WEEK,type DayOfWeek,type SchoolClass,formatTimeRange } from "./types/Class";

const ACCENT = "var(--color-maroon)";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function useClassViewPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { getClass, loading: classesLoading, error: classesError, refreshClasses } = useClasses();
  const { teachers, loading: teachersLoading, error: teachersError, refetchTeachers } = useTeachers();
  const { students, loading: studentsLoading, error: studentsError, refetch: refetchStudents } = useStudents();
  const [activeTab, setActiveTab] = useState<"schedule" | "class-list">("schedule");
  const fetchedClass = classId ? getClass(classId) : undefined;
  const schoolClass: SchoolClass = fetchedClass ?? { id: classId ?? "", gradeLevelId: 0, gradeLevel: "", sectionId: null, section: null, room: null, adviserId: "", adviserName: "", schedule: [] };
  const loading = classesLoading || teachersLoading || studentsLoading;
  const error = classesError ?? teachersError ?? studentsError;
  const retry = () => { refreshClasses(); refetchTeachers(); void refetchStudents(); };
  const view = `admin-class:${classId}`;
  const table = useRef<HTMLTableElement>(null);
  const columns = [{ label: "Time", typical: "7:30 AM - 8:30 AM" }, ...DAYS_OF_WEEK.map(day => ({ label: day, typical: "Mathematics Teacher Cruz" }))];
  const widths = useColumnReservation(`${view}:schedule`, columns, loading);

  if (!classesLoading && !fetchedClass && !classesError) {
    return { content: ((
      <div className="max-w-7xl mx-auto pb-12">
        <section className={`rounded-xl border shadow-xs p-8 text-center ${panelBg} ${panelBorder}`}>
          <p className={`text-sm font-semibold ${textMuted}`} data-sk-region="classviewpage-no-class-found-with-id" data-sk-static="">No class found with ID <span className="font-bold">{classId}</span>.</p>
          <button onClick={() => navigate("/admin/classes")} className="mt-4 h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2" style={{ background: ACCENT }} data-sk-region="classviewpage-back-to-classes" data-sk-static="">
            <ArrowLeft size={14} /> Back to Classes
          </button>
        </section>
      </div>
    )), scope: {  } };
  }

  const hasAdviser = Boolean(schoolClass.adviserName && schoolClass.adviserName !== "Unassigned");
  const initials = hasAdviser ? schoolClass.adviserName.split(" ").map((n) => n[0]).slice(0, 2).join("") : "?";
  const adviser = hasAdviser ? teachers.find((teacher) => String(teacher.id) === String(schoolClass.adviserId)) : undefined;
  const adviserAvatarSrc = getTeacherAvatar(adviser);
  const adviserAvatarBorderColor = getTeacherAvatarBorderColor(adviser?.gender);
  const roster = students.filter((student) => student.gradeLevel === schoolClass.gradeLevel && student.section === schoolClass.section);
  const totalSubjects = new Set(schoolClass.schedule.map((period) => period.subject.trim()).filter(Boolean)).size;
  const timeSlots = Array.from(
    new Map(schoolClass.schedule.map((period) => [`${period.startTime}-${period.endTime}`, { startTime: period.startTime, endTime: period.endTime }])).values(),
  ).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const cellFor = (day: DayOfWeek, startTime: string, endTime: string) => schoolClass.schedule.find((period) => period.startTime === startTime && period.endTime === endTime && period.days.includes(day));
  const rowHeaderBg = darkMode ? "color-mix(in srgb, var(--brand-primary) 35%, transparent)" : ACCENT;
  const renderScheduleRows = (pending: boolean) => {
    const slots = pending ? Array.from({ length: skeletonRows(`${view}:schedule`, undefined, 105) }, () => ({ startTime: "", endTime: "" })) : timeSlots;
    if (!slots.length) return <tr><td colSpan={columns.length} className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>No schedule set yet.</td></tr>;
    return slots.map((slot, index) => <tr key={pending ? index : `${slot.startTime}-${slot.endTime}`} data-sk-region="class-schedule-row" data-sk-item="" className={`border-t ${panelBorder}`}>
      <td data-sk-region="class-schedule-time" className="sk-surface-brand sk-surface-class-time whitespace-nowrap px-4 py-3 align-top font-bold text-white" style={{ background: rowHeaderBg }}>{pending ? <SkeletonText width="16ch" /> : formatTimeRange(slot.startTime, slot.endTime)}</td>
      {DAYS_OF_WEEK.map(day => {
        const period = pending ? undefined : cellFor(day, slot.startTime, slot.endTime);
        return <td key={day} data-sk-region={`class-schedule-${day}`} className={`border-l px-4 py-3 text-center align-top ${panelBorder}`}>{pending || period ? <><p data-sk-variable="" data-sk-field={`${view}:${index}:${day}:subject`} className={`font-bold ${textPrimary}`} data-sk-region="classviewpage-p-field-4">{pending ? <SkeletonParagraph field={`${view}:${index}:${day}:subject`} typical={2} width="16ch" /> : period?.subject}</p><p data-sk-variable="" data-sk-field={`${view}:${index}:${day}:teacher`} className={`mt-0.5 text-xs font-semibold ${textMuted}`} data-sk-region="classviewpage-p-field-5">{pending ? <SkeletonParagraph field={`${view}:${index}:${day}:teacher`} typical={2} width="14ch" /> : period?.teacherName || "Unassigned"}</p></> : <span className={textMuted}>—</span>}</td>;
      })}
    </tr>);
  };
  const renderSchedule = (pending: boolean) => !pending && !timeSlots.length ? <p className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`} data-sk-region="classviewpage-no-schedule-set-yet-" data-sk-static="">No schedule set yet.</p> : <div className="overflow-x-auto">
    <table ref={table} className="teacher-user-table w-full min-w-160 border-collapse text-xs">
      {pending && <colgroup>{widths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>}
      <thead><tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
        <th className={`px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider ${textMuted}`} data-sk-region="classviewpage-time" data-sk-static="">Time</th>
        {DAYS_OF_WEEK.map(day => <th key={day} className={`border-l px-4 py-2.5 text-center text-xs font-black uppercase tracking-wider ${panelBorder} ${textMuted}`}>{day}</th>)}
      </tr></thead>
      <tbody>{renderScheduleRows(pending)}</tbody>
    </table>
  </div>;

  return { content: ((
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12 font-sans" data-sk-region="classviewpage-div-field-6">
      <div className="flex items-center gap-3">
        <BackButton onClick={() => navigate("/admin/classes")} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className={`qed-type-page-title ${textPrimary}`} data-sk-region="classviewpage-class-details" data-sk-static="">Class Details</h1>
            <p className={`qed-type-page-description mt-0.5 ${textMuted}`} data-sk-region="classviewpage-p-field-7">
              {error ? <span>{schoolClass.gradeLevel}{schoolClass.section ? ` · Section ${schoolClass.section}` : ""}</span> : <LoadingRegion as="span" name="class-identity" loading={loading && !error} variable skeleton={<SkeletonParagraph field={`${view}:identity`} typical={2} />}><span data-sk-field={`${view}:identity`}>{schoolClass.gradeLevel}{schoolClass.section ? ` · Section ${schoolClass.section}` : ""}</span></LoadingRegion>}
            </p>
          </div>
          <button disabled={loading || !!error} onClick={() => navigate(`/admin/classes/${schoolClass.id}/edit`)} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold text-white transition-colors hover:bg-maroon-light" style={{ background: ACCENT }} data-sk-region="classviewpage-edit-class" data-sk-static="">
            <Pencil size={14} /> Edit Class
          </button>
        </div>
      </div>

      {error && <LoadingRegion loading={false} error={error} retry={retry} skeleton={null}>{null}</LoadingRegion>}
      {!error && <>
      <ProfileOverviewCard
        loading={loading}
        fieldKey={view}
        label={`${schoolClass.adviserName || "Class adviser"} teacher profile`}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        avatarBorderColor={adviserAvatarBorderColor}
        avatar={adviserAvatarSrc ? <img src={adviserAvatarSrc} alt={`${schoolClass.adviserName} profile`} className="h-full w-full object-cover" /> : initials || <UserRound className="h-9 w-9" />}
        name={schoolClass.adviserName || "Unassigned"}
        subtitlePrefix="Teacher · "
        subtitle={`Teacher · ${schoolClass.gradeLevel}${schoolClass.section ? ` · ${schoolClass.section}` : ""}`}
        identityDetails={<LoadingRegion loading={loading} variable name="class-adviser-contacts" skeleton={
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <span className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${panelBorder} ${textMuted}`}><Mail size={12} className="shrink-0" /><SkeletonText width="18ch" /></span>
            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${panelBorder} ${textMuted}`}><Phone size={12} className="shrink-0" /><SkeletonText width="11ch" /></span>
          </div>
        }>{hasAdviser && (schoolClass.adviserEmail || schoolClass.adviserContact) ? (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {schoolClass.adviserEmail && <a href={`mailto:${schoolClass.adviserEmail}`} className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${panelBorder} ${textMuted}`}><Mail size={12} className="shrink-0" /><span className="truncate">{schoolClass.adviserEmail}</span></a>}
            {schoolClass.adviserContact && <a href={`tel:${schoolClass.adviserContact}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${panelBorder} ${textMuted}`}><Phone size={12} className="shrink-0" />{schoolClass.adviserContact}</a>}
          </div>
        ) : undefined}</LoadingRegion>}
        stats={[
          { label: "Advisory", value: schoolClass.section ? `${schoolClass.gradeLevel} · ${schoolClass.section}` : schoolClass.gradeLevel },
          { label: "Room", value: schoolClass.room || "Not assigned" },
          { label: "Total subjects", value: totalSubjects },
        ]}
        tabs={[
          { id: "schedule", label: "Class schedule" },
          { id: "class-list", label: "Class list", count: roster.length },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as "schedule" | "class-list")}
      />

      {activeTab === "schedule" ? (
        <section id="class-schedule-panel" role="tabpanel" aria-label="Class schedule" className={`overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`}>
          <div className={`border-b px-4 py-3 ${panelBorder}`}>
            <h2 className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`} data-sk-region="classviewpage-class-schedule" data-sk-static="">Class schedule</h2>
          </div>
          <LoadingRegion name="class-schedule" loading={loading} variable autoColumns skeleton={null} frame={renderSchedule} retainPrevious hasContent={timeSlots.length > 0} onSettled={() => { rememberRows(`${view}:schedule`, timeSlots.length); rememberColumns(`${view}:schedule`, table.current); }}>{null}</LoadingRegion>
        </section>
      ) : (
        <div id="class-list-panel" role="tabpanel" aria-label="Class list">
          <StudentDirectory
            loading={loading}
            error={error}
            retry={retry}
            view={`${view}:roster`}
            students={roster.map((student) => ({ id: String(student.id), studentId: student.studentId, name: formatFullName(student), gender: student.gender }))}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            darkMode={darkMode}
            onActivate={(id) => navigate(`/admin/students/${id}`)}
          />
        </div>
      )}
      </>}
    </div>
  )), scope: {  } };
}


export type ClassViewPageEffectScope = ReturnType<typeof useClassViewPageState>["scope"];
export type ClassViewPageRouteProps = Record<string, never>;
export function ClassViewPageComposition(props: object & { effects?: (scope: ClassViewPageEffectScope) => import("react").ReactNode }) {
 const state = useClassViewPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
