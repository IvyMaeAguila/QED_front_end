import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
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
import { AssignTeacherModal } from "./components/AssignTeacherModal";
import { AddSubjectModal } from "./components/AddSubjectModal";
import { ManageSectionsModal } from "./components/ManageSectionsModal";
import { SectionsProvider } from "./context/SectionsContext";
import { useSettings } from "../settings/context/SettingsContext";
import {
  saveSubjectAssignment,
  updateSubjectAssignment,
  assignTeacherToSubject,
} from "./services/subject.service";
import { GradeLevelsProvider } from "./context/gradeLevelsContext";
import { SubjectsCatalogProvider } from "./context/SubjectsCatalogContext";
import {
  SubjectSectionsProvider,
  useSubjectSections,
} from "./context/SubjectSectionsContext";

export function ManageSubjectsPage() {
  return (
    <GradeLevelsProvider>
      <SubjectsCatalogProvider>
        <SectionsProvider>
          <SubjectSectionsProvider>
            <ManageSubjectsPageContent />
          </SubjectSectionsProvider>
        </SectionsProvider>
      </SubjectsCatalogProvider>
    </GradeLevelsProvider>
  );
}

function ManageSubjectsPageContent() {
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;

  const { schoolYear } = useSettings();
  const {
    getSubjectsForGrade,
    loadSubjectsForGrade,
    addLocalSubject,
    updateLocalSubject,
  } = useSubjectSections();

  const [activeGrade, setActiveGrade] = useState<GradeLevel>("Grade 1");
  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Active" | "Inactive"
  >("all");

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [assigningSubject, setAssigningSubject] = useState<Subject | null>(
    null,
  );
  const [addingSubject, setAddingSubject] = useState(false);
  const [managingSections, setManagingSections] = useState(false);

  const [savingSubject, setSavingSubject] = useState(false);
  const [addSubjectError, setAddSubjectError] = useState<string | null>(null);

  const [savingEdit, setSavingEdit] = useState(false);
  const [editSubjectError, setEditSubjectError] = useState<string | null>(null);

  const [savingAssign, setSavingAssign] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

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
    return true;
  });

  async function toggleStatus(subject: Subject) {
    const newStatus = subject.status === "Active" ? "Inactive" : "Active";

    // optimistic update muna para mabilis yung feel ng UI
    updateLocalSubject(subject.id, { status: newStatus });

    try {
      await updateSubjectAssignment(subject.id, {
        gradeLevelId: GRADE_LEVEL_IDS[subject.gradeLevel],
        subjectName: subject.name,
        sectionName: subject.section,
        teacherId: subject.teacherId,
        schoolYear: subject.schoolYear,
        status: newStatus,
      });
    } catch (err) {
      console.error("Failed to toggle status:", err);
      // ibalik yung status kung na-fail sa backend
      updateLocalSubject(subject.id, { status: subject.status });
    }
  }

  async function addSubject(newSubject: Omit<Subject, "id">) {
    setSavingSubject(true);
    setAddSubjectError(null);
    try {
      const row = await saveSubjectAssignment({
        gradeLevelId: GRADE_LEVEL_IDS[newSubject.gradeLevel],
        subjectName: newSubject.name,
        sectionName: newSubject.section,
        teacherId: newSubject.teacherId,
        schoolYear: newSubject.schoolYear,
        status: newSubject.status,
      });

      addLocalSubject({ ...newSubject, id: String(row.id) });
      setActiveGrade(newSubject.gradeLevel);
      setAddingSubject(false);
    } catch (err) {
      console.error("Failed to add subject:", err);
      setAddSubjectError(
        err instanceof Error ? err.message : "Failed to add subject.",
      );
    } finally {
      setSavingSubject(false);
    }
  }

  async function saveEditedSubject(
    subject: Subject,
    updates: Partial<Subject>,
  ) {
    setSavingEdit(true);
    setEditSubjectError(null);
    try {
      await updateSubjectAssignment(subject.id, {
        gradeLevelId: GRADE_LEVEL_IDS[subject.gradeLevel],
        subjectName: updates.name ?? subject.name,
        sectionName: updates.section ?? subject.section,
        teacherId: updates.teacherId ?? subject.teacherId,
        schoolYear: updates.schoolYear ?? subject.schoolYear,
        status: updates.status ?? subject.status,
      });
      updateLocalSubject(subject.id, updates);
      setEditingSubject(null);
    } catch (err) {
      console.error("Failed to update subject:", err);
      setEditSubjectError(
        err instanceof Error ? err.message : "Failed to update subject.",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function saveAssignedTeacher(
    subject: Subject,
    updates: Partial<Subject>,
  ) {
    setSavingAssign(true);
    setAssignError(null);
    try {
      await assignTeacherToSubject(subject.id, {
        gradeLevelId: GRADE_LEVEL_IDS[subject.gradeLevel],
        sectionName: updates.section ?? subject.section,
        teacherId: updates.teacherId ?? subject.teacherId,
      });
      updateLocalSubject(subject.id, updates);
      setAssigningSubject(null);
    } catch (err) {
      console.error("Failed to assign teacher:", err);
      setAssignError(
        err instanceof Error ? err.message : "Failed to assign teacher.",
      );
    } finally {
      setSavingAssign(false);
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
            onClick={() => {
              setAddSubjectError(null);
              setAddingSubject(true);
            }}
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

      {assigningSubject && (
        <AssignTeacherModal
          subject={assigningSubject}
          {...theme}
          onClose={() => {
            setAssigningSubject(null);
            setAssignError(null);
          }}
          onAssign={(updates) => saveAssignedTeacher(assigningSubject, updates)}
          saving={savingAssign}
          error={assignError}
        />
      )}

      {addingSubject && (
        <AddSubjectModal
          subjects={gradeSubjects}
          defaultGrade={activeGrade}
          schoolYear={schoolYear}
          {...theme}
          onClose={() => setAddingSubject(false)}
          onAdd={addSubject}
          onManageSections={() => {
            setAddingSubject(false);
            setManagingSections(true);
          }}
          saving={savingSubject}
          error={addSubjectError}
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
