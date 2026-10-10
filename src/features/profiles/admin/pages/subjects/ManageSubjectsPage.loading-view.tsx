import { SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { rememberRows,skeletonRows } from "@shared/loading/reservations";
import { useMemo,useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { useToast } from "../../../../../shared/context/ToastContext";
import type { AdminThemeContext } from "../AdminLayout";
import { AssignTeacherModal } from "./components/AssignTeacherModal";
import { EditSubjectModal } from "./components/EditSubjectModal";
import { ManageSectionsModal } from "./components/ManageSectionsModal";
import { SubjectActions } from "./components/SubjectActions";
import { SubjectCard } from "./components/SubjectCard";
import { SubjectFilters } from "./components/SubjectFilters";
import { useSubjectSections } from "./context/SubjectSectionsContext";
import { useSubjectsCatalog } from "./context/SubjectsCatalogContext";
import {
toWeightPayload,
toggleSubjectStatus as toggleSubjectStatusApi,
updateSubjectAssignment,
} from "./services/subject.service";
import {
GRADE_LEVELS,
GRADE_LEVEL_IDS,
type GradeLevel,
type Subject,
} from "./types/types";

function useManageSubjectsPageState() {
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const navigate = useNavigate();

  const { assessmentTypes } = useSubjectsCatalog();
  const { getSubjectsForGrade, loadSubjectsForGrade, updateLocalSubject, loading, error } =
    useSubjectSections();

  // "all" = All Grades (walang grade filter)
  const [activeGrade, setActiveGrade] = useState<GradeLevel | "all">("all");
  // Pangalan ng section (Subject.section), hindi ang section id — para direktang
  // ma-compare sa subject.section pag-filter. null = "All Sections"/walang section filter.
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Active" | "Inactive"
  >("all");
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [assigningSubject, setAssigningSubject] = useState<Subject | null>(null);
  const [managingSections, setManagingSections] = useState(false);

  // Whether subjects are clustered into "Grade · Section" groups.
  // Grouped is the default view; the admin can switch to one flat list.
  const [groupBySection, setGroupBySection] = useState(true);

  const [savingEdit, setSavingEdit] = useState(false);
  const [editSubjectError, setEditSubjectError] = useState<string | null>(null);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const { showToast } = useToast();

  const gradeSubjects =
    activeGrade === "all"
      ? GRADE_LEVELS.flatMap((g) => getSubjectsForGrade(g))
      : getSubjectsForGrade(activeGrade);

  // ManageSectionsModal needs a specific grade, so fall back to the first one
  // when "All Grades" is selected.
  const modalGrade: GradeLevel =
    activeGrade === "all" ? GRADE_LEVELS[0] : activeGrade;
  const modalSubjects =
    activeGrade === "all" ? getSubjectsForGrade(modalGrade) : gradeSubjects;

  const filtered = gradeSubjects.filter((s) => {
    if (
      search.trim() &&
      !s.name.toLowerCase().includes(search.trim().toLowerCase())
    )
      return false;
    if (teacherFilter !== "all" && s.teacherId !== teacherFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (activeSection && s.section !== activeSection) return false;
    return true;
  });

  // Cluster by "Grade Level · Section X". Sorted by grade id (not by label),
  // so Grade 2 comes before Grade 10.
  const groupedSubjects = useMemo(() => {
    const groups = new Map<
      string,
      { label: string; gradeId: number; section: string; items: Subject[] }
    >();

    for (const subject of filtered) {
      const key = `${subject.gradeLevel}||${subject.section ?? ""}`;
      if (!groups.has(key)) {
        groups.set(key, {
          label: subject.section
            ? `${subject.gradeLevel} · Section ${subject.section}`
            : subject.gradeLevel,
          gradeId: GRADE_LEVEL_IDS[subject.gradeLevel] ?? 0,
          section: subject.section ?? "",
          items: [],
        });
      }
      groups.get(key)!.items.push(subject);
    }

    return Array.from(groups.values()).sort(
      (a, b) => a.gradeId - b.gradeId || a.section.localeCompare(b.section),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  async function toggleStatus(subject: Subject) {
    const newStatus = subject.status === "Active" ? "Inactive" : "Active";

    updateLocalSubject(subject.id, { status: newStatus });

    try {
      await toggleSubjectStatusApi(subject.id);
    } catch (err) {
      console.error("Failed to toggle status:", err);
      updateLocalSubject(subject.id, { status: subject.status });
    }
  }

  async function saveEditedSubject(
    subject: Subject,
    updates: Partial<Subject>,
  ) {
    setSavingEdit(true);
    setEditSubjectError(null);
    try {
      const isGraded = updates.isGraded ?? subject.isGraded;
      const weightDistribution = isGraded
        ? toWeightPayload(updates.weightDistribution ?? [], assessmentTypes)
        : [];

      await updateSubjectAssignment(subject.id, {
        isGraded,
        weightDistribution,
        subjectName: updates.name ?? subject.name,
        gradeLevelId: GRADE_LEVEL_IDS[updates.gradeLevel ?? subject.gradeLevel],
        sectionName: updates.section ?? subject.section,
        teacherId: updates.teacherId ?? null,
        schoolYear: updates.schoolYear ?? subject.schoolYear,
      });

      updateLocalSubject(subject.id, {
        name: updates.name ?? subject.name,
        gradeLevel: updates.gradeLevel ?? subject.gradeLevel,
        section: updates.section ?? subject.section,
        teacherId: updates.teacherId ?? null,
        schoolYear: updates.schoolYear ?? subject.schoolYear,
        isGraded,
        ...(isGraded
          ? { weightDistribution: updates.weightDistribution ?? [] }
          : {}),
      });
      if (updates.gradeLevel && updates.gradeLevel !== subject.gradeLevel) {
        await Promise.all([
          loadSubjectsForGrade(subject.gradeLevel),
          loadSubjectsForGrade(updates.gradeLevel),
        ]);
      }

      setEditingSubject(null);
      showToast("Subject Updated Successfully!", "success");
    } catch (err) {
      console.error("Failed to update subject:", err);
      setEditSubjectError(
        err instanceof Error ? err.message : "Failed to update subject.",
      );
      showToast(
        err instanceof Error ? err.message : "Failed to update subject.",
        "error",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function saveTeacherAssignment(subject: Subject, updates: Partial<Subject>) {
    setSavingAssignment(true);
    setAssignmentError(null);
    try {
      const isGraded = subject.isGraded;
      const weightDistribution = isGraded
        ? toWeightPayload(subject.weightDistribution ?? [], assessmentTypes)
        : [];

      await updateSubjectAssignment(subject.id, {
        isGraded,
        weightDistribution,
        subjectName: subject.name,
        gradeLevelId: GRADE_LEVEL_IDS[subject.gradeLevel],
        sectionName: subject.section,
        teacherId: updates.teacherId ?? null,
        schoolYear: subject.schoolYear,
      });
      updateLocalSubject(subject.id, { teacherId: updates.teacherId ?? null });
      setAssigningSubject(null);
      showToast("Teacher Assigned Successfully!", "success");
    } catch (err) {
      console.error("Failed to assign teacher:", err);
      const message = err instanceof Error ? err.message : "Failed to assign teacher.";
      setAssignmentError(message);
      showToast(message, "error");
    } finally {
      setSavingAssignment(false);
    }
  }

  // Single card renderer shared by the grouped and flat views.
  const renderCard = (subject: Subject, pending = false) => (
    <SubjectCard
      loading={pending}
      key={subject.id}
      subject={subject}
      {...theme}
      onEdit={() => setEditingSubject(subject)}
      onAssign={() => {
        setAssignmentError(null);
        setAssigningSubject(subject);
      }}
      onToggleStatus={() => toggleStatus(subject)}
    />
  );

  const view = JSON.stringify(["admin/subjects", activeGrade, activeSection, search, teacherFilter, statusFilter, groupBySection]);
  const retry = () => { if (activeGrade === "all") GRADE_LEVELS.forEach(grade => void loadSubjectsForGrade(grade)); else void loadSubjectsForGrade(activeGrade); };
  function renderCollection(pending: boolean) {
    const items: Subject[] = pending ? Array.from({length:skeletonRows(view)}, (_, index) => ({id:String(index),name:"",gradeLevel:"Grade 1",isGraded:true,section:"",teacherId:null,schoolYear:"",status:"Active"})) : filtered;
    const groups = pending ? [{label:"",gradeId:0,section:"",items}] : groupedSubjects;
    return (<>
      {!pending && filtered.length === 0 ? (
        <div
          className={`rounded-2xl border shadow-sm p-12 text-center ${panelBg} ${panelBorder}`}
        >
          <p className={`text-sm font-semibold ${textMuted}`} data-sk-region="managesubjectspage-no-subjects-match-the-current-filters-" data-sk-static="">
            No subjects match the current filters.
          </p>
        </div>
      ) : (
        <div
          className={`rounded-2xl border shadow-sm p-5 ${panelBorder} ${
            darkMode ? panelBg : "bg-white"
          }`} data-sk-region="managesubjectspage-div-field-1"
        >
          {groupBySection ? (
            <div className="space-y-7" data-sk-region="managesubjectspage-div-field-2">
              {groups.map((group) => (
                <div key={group.label}>
                  {/* Section header */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-maroon" />
                    <h4
                      className={`text-xs font-extrabold uppercase tracking-wide ${textPrimary}`} data-sk-region="managesubjectspage-h4-field-3"
                    >
                      {pending ? <SkeletonText width="15ch" /> : group.label}
                    </h4>
                    <span className={`text-xs font-semibold ${textMuted}`}>
                      ({group.items.length} subject
                      {group.items.length === 1 ? "" : "s"})
                    </span>
                    <span
                      className={`h-px flex-1 ${
                        darkMode ? "bg-white/10" : "bg-gray-200"
                      }`}
                    />
                  </div>

                  {/* Subject cards for this section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {group.items.map(subject => renderCard(subject, pending))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(subject => renderCard(subject, pending))}
            </div>
          )}
        </div>
      )}

    </>);
  }

  return { content: ((
    <div className="w-full min-h-full space-y-6 pb-12">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <div>
            <h1 className={`qed-type-page-title ${textPrimary}`} data-sk-region="managesubjectspage-manage-subjects" data-sk-static="">
              Manage Subjects
            </h1>
            <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
              {filtered.length} of {gradeSubjects.length} subject
              {gradeSubjects.length === 1 ? "" : "s"} shown
            </p>
          </div>
        </div>

        <SubjectActions
          darkMode={darkMode}
          onAcademicYear={() => navigate("/admin/academic-year")}
          onManageSections={() => setManagingSections(true)}
          onAddSubject={() => navigate("new")}
        />
      </div>

      <SubjectFilters
        {...theme}
        search={search}
        onSearchChange={setSearch}
        teacherFilter={teacherFilter}
        onTeacherFilterChange={setTeacherFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        activeGrade={activeGrade}
        onGradeChange={setActiveGrade}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        groupBySection={groupBySection}
        onGroupBySectionChange={setGroupBySection}
      />

      <LoadingRegion name="admin-subject-collection" loading={loading} error={error} retry={retry} variable frame={renderCollection} retainPrevious hasContent={filtered.length > 0} skeleton={renderCollection(true)} onSettled={() => rememberRows(view, filtered.length)}>{renderCollection(false)}</LoadingRegion>

      {editingSubject && (
        <EditSubjectModal
          subject={editingSubject}
          {...theme}
          onClose={() => {
            setEditingSubject(null);
            setEditSubjectError(null);
          }}
          onSave={(updates) => saveEditedSubject(editingSubject, updates)}
          onManageSections={() => {
            setEditingSubject(null);
            setManagingSections(true);
          }}
          saving={savingEdit}
          error={editSubjectError}
        />
      )}

      {assigningSubject && (
        <AssignTeacherModal
          subject={assigningSubject}
          {...theme}
          onClose={() => {
            setAssigningSubject(null);
            setAssignmentError(null);
          }}
          onAssign={(updates) => saveTeacherAssignment(assigningSubject, updates)}
          saving={savingAssignment}
          error={assignmentError}
        />
      )}

      {managingSections && (
        <ManageSectionsModal
          defaultGrade={modalGrade}
          subjects={modalSubjects}
          {...theme}
          onClose={() => setManagingSections(false)}
        />
      )}
    </div>
  )), scope: { activeGrade, GRADE_LEVELS, loadSubjectsForGrade } };
}


export type ManageSubjectsPageEffectScope = ReturnType<typeof useManageSubjectsPageState>["scope"];
export type ManageSubjectsPageRouteProps = Record<string, never>;
export function ManageSubjectsPageComposition(props: object & { effects?: (scope: ManageSubjectsPageEffectScope) => import("react").ReactNode }) {
 const state = useManageSubjectsPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
