import { SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { ArrowLeft,Mail,Pencil,Phone,UserRound } from "lucide-react";
import { lazy,Suspense,useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { ProfileOverviewCard } from "../../../../../shared/components/ProfileOverviewCard";
import { getTeacherAvatar,getTeacherAvatarBorderColor } from "../../../../../shared/profile/utils/teacherAvatar";
import { BackButton } from "../../../shared/components/DashboardUI";
import type { AdminThemeContext } from "../AdminLayout";
import { useStudents } from "../studentrecords/context/StudentsContext";
import { useClasses } from "./context/ClassesContext";
import { useTeachers } from "./context/TeachersContext";
import { type SchoolClass } from "./types/Class";

const ClassSchedulePanel = lazy(() => import("./components/ClassSchedulePanel"));
const ClassRosterPanel = lazy(() => import("./components/ClassRosterPanel"));

const ACCENT = "var(--color-maroon)";

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
  const roster = students.filter((student) => Number(student.gradeLevelId) === Number(schoolClass.gradeLevelId) && student.sectionId === schoolClass.sectionId);
  const totalSubjects = new Set(schoolClass.schedule.map((period) => period.subject.trim()).filter(Boolean)).size;

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
          <button disabled={loading || !!error} onClick={() => navigate(`/admin/classes/${schoolClass.id}/edit`)} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-4 text-xs font-bold text-white transition-colors hover:bg-maroon-light" style={{ background: ACCENT }} data-sk-region="classviewpage-edit-class" data-sk-static="">
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
        <div id="class-schedule-panel" role="tabpanel" aria-label="Class schedule">
          <Suspense fallback={<div className={`rounded-xl border p-6 ${panelBg} ${panelBorder}`}><SkeletonText width="20ch" /></div>}>
            <ClassSchedulePanel schoolClass={schoolClass} loading={loading} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode} />
          </Suspense>
        </div>
      ) : (
        <div id="class-list-panel" role="tabpanel" aria-label="Class list" className="flex flex-col gap-3">
          <Suspense fallback={<div className={`rounded-xl border p-4 ${panelBg} ${panelBorder}`}><SkeletonText width="12ch" /><div className="mt-4 grid gap-3 sm:grid-cols-2"><SkeletonParagraph field={`${view}:roster-male`} typical={3} /><SkeletonParagraph field={`${view}:roster-female`} typical={3} /></div></div>}>
            <ClassRosterPanel
              roster={roster} schoolClass={schoolClass} loading={loading} error={error} retry={retry} view={view}
              panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode}
              onStudentActivate={id => navigate(`/admin/students/${id}/edit`)}
            />
          </Suspense>
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
