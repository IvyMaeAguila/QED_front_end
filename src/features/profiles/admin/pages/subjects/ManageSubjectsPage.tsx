import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Plus, School } from "lucide-react";
import type { AdminThemeContext } from "../AdminLayout";
import {
  ACCENT,
  GRADE_LEVEL_IDS,
  type GradeLevel,
  type Subject,
} from "./types/types";
import { AdminTopTabs } from "./components/AdminTopTabs";
import { SubjectFilters } from "./components/SubjectFilters";
import { GradeLevelTabs } from "./components/GradeLevelTabs";
import { SubjectCard } from "./components/SubjectCard";
import { EditSubjectModal } from "./components/EditSubjectModal";
import { ManageSectionsModal } from "./components/ManageSectionsModal";
import {
  toggleSubjectStatus as toggleSubjectStatusApi,
  updateSubjectAssignment,
  toWeightPayload,
} from "./services/subject.service";
import {
  useSubjectSections,
} from "./context/SubjectSectionsContext";
import { useSubjectsCatalog } from "./context/SubjectsCatalogContext";
import { useToast } from "../../../../../shared/context/ToastContext";

export function ManageSubjectsPage() {
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const navigate = useNavigate();

  const { assessmentTypes } = useSubjectsCatalog();
  const {
    getSubjectsForGrade,
    loadSubjectsForGrade,
    updateLocalSubject,
  } = useSubjectSections();

  const [activeGrade, setActiveGrade] = useState<GradeLevel>("Grade 1");
  // Pangalan ng section (Subject.section), hindi ang section id — para direktang
  // ma-compare sa subject.section pag-filter. null = "All Sections"/walang section filter.
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
 const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [ , setAssigningSubject] = useState<Subject | null>(
    null,
  );
  const [managingSections, setManagingSections] = useState(false);

  const [savingEdit, setSavingEdit] = useState(false);
  const [editSubjectError, setEditSubjectError] = useState<string | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    void loadSubjectsForGrade(activeGrade);
  }, [activeGrade, loadSubjectsForGrade]);

  const gradeSubjects = getSubjectsForGrade(activeGrade);

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

  return (
    <div className="space-y-6 pb-12">
      <AdminTopTabs
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
            Manage Subjects
          </h1>
          <p className={`text-sm font-semibold mt-1 ${textMuted}`}>
            Manage default curriculum subjects and teacher assignments.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setManagingSections(true)}
            className={`h-10 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-2 border transition-colors ${
              darkMode
                ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            <School size={14} />
            Manage Sections
          </button>
          <button
            onClick={() => navigate("new")}
            className="h-10 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: ACCENT }}
          >
            <Plus size={14} />
            Add Subject
          </button>
        </div>
      </div>

      <SubjectFilters
        {...theme}
        search={search}
        onSearchChange={setSearch}
        teacherFilter={teacherFilter}
        onTeacherFilterChange={setTeacherFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <GradeLevelTabs
        activeGrade={activeGrade}
        onChange={setActiveGrade}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              {...theme}
              onEdit={() => setEditingSubject(subject)}
              onAssign={() => setAssigningSubject(subject)}
              onToggleStatus={() => toggleStatus(subject)}
            />
          ))}
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
          defaultGrade={activeGrade}
          subjects={gradeSubjects}
          {...theme}
          onClose={() => setManagingSections(false)}
        />
      )}
    </div>
  );
}
