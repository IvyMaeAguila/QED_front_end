import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { BookOpen } from "lucide-react";
import type { AdminThemeContext } from "../AdminLayout";
import {
  GRADE_LEVELS,
  GRADE_LEVEL_IDS,
  type GradeLevel,
  type Subject,
} from "./types/types";
import { SubjectFilters } from "./components/SubjectFilters";
import { SubjectActions } from "./components/SubjectActions";
import { SubjectCard } from "./components/SubjectCard";
import { EditSubjectModal } from "./components/EditSubjectModal";
import { ManageSectionsModal } from "./components/ManageSectionsModal";
import {
  toggleSubjectStatus as toggleSubjectStatusApi,
  updateSubjectAssignment,
  toWeightPayload,
} from "./services/subject.service";
import { useSubjectSections } from "./context/SubjectSectionsContext";
import { useSubjectsCatalog } from "./context/SubjectsCatalogContext";
import { useToast } from "../../../../../shared/context/ToastContext";

export function ManageSubjectsPage() {
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const navigate = useNavigate();

  const { assessmentTypes } = useSubjectsCatalog();
  const { getSubjectsForGrade, loadSubjectsForGrade, updateLocalSubject } =
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
  const [, setAssigningSubject] = useState<Subject | null>(null);
  const [managingSections, setManagingSections] = useState(false);

  // Whether subjects are clustered into "Grade · Section" groups.
  // Grouped is the default view; the admin can switch to one flat list.
  const [groupBySection, setGroupBySection] = useState(true);

  const [savingEdit, setSavingEdit] = useState(false);
  const [editSubjectError, setEditSubjectError] = useState<string | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    if (activeGrade === "all") {
      GRADE_LEVELS.forEach((g) => void loadSubjectsForGrade(g));
    } else {
      void loadSubjectsForGrade(activeGrade);
    }
  }, [activeGrade, loadSubjectsForGrade]);

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

  // Single card renderer shared by the grouped and flat views.
  const renderCard = (subject: Subject) => (
    <SubjectCard
      key={subject.id}
      subject={subject}
      {...theme}
      onEdit={() => setEditingSubject(subject)}
      onAssign={() => setAssigningSubject(subject)}
      onToggleStatus={() => toggleStatus(subject)}
    />
  );

  return (
    <div className="w-full min-h-full space-y-4 px-6 pb-12 pt-6 lg:px-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
              Manage Subjects
            </h1>
            <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
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

      {filtered.length === 0 ? (
        <div
          className={`rounded-2xl border shadow-sm p-12 text-center ${panelBg} ${panelBorder}`}
        >
          <p className={`text-sm font-semibold ${textMuted}`}>
            No subjects match the current filters.
          </p>
        </div>
      ) : (
        <div
          className={`rounded-2xl border shadow-sm p-5 ${panelBorder} ${
            darkMode ? panelBg : "bg-white"
          }`}
        >
          {groupBySection ? (
            <div className="space-y-7">
              {groupedSubjects.map((group) => (
                <div key={group.label}>
                  {/* Section header */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-[#800000]" />
                    <h4
                      className={`text-xs font-extrabold uppercase tracking-wide ${textPrimary}`}
                    >
                      {group.label}
                    </h4>
                    <span className={`text-[10px] font-semibold ${textMuted}`}>
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
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {group.items.map(renderCard)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(renderCard)}
            </div>
          )}
        </div>
      )}

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

      {managingSections && (
        <ManageSectionsModal
          defaultGrade={modalGrade}
          subjects={modalSubjects}
          {...theme}
          onClose={() => setManagingSections(false)}
        />
      )}
    </div>
  );
}