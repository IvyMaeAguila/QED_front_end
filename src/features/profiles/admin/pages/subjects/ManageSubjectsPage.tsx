import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, School } from "lucide-react";
import { useTeachers } from "../classes/context/TeachersContext";
import type { AdminThemeContext } from "../AdminLayout";
import { buildDefaultSubjects } from "./data";
import { ACCENT, type GradeLevel, type Subject } from "./types";
import { SubjectFilters } from "./components/SubjectFilters";
import { GradeLevelTabs } from "./components/GradeLevelTabs";
import { SubjectCard } from "./components/SubjectCard";
import { EditSubjectModal } from "./components/EditSubjectModal";
import { AssignTeacherModal } from "./components/AssignTeacherModal";
import { AddSubjectModal } from "./components/AddSubjectModal";
import { ManageSectionsModal } from "./components/ManageSectionsModal";
import { SectionsProvider } from "./context/SectionsContext";
import { useSettings } from "../settings/context/SettingsContext";

export function ManageSubjectsPage() {
  return (
    <SectionsProvider>
      <ManageSubjectsPageContent />
    </SectionsProvider>
  );
}

function ManageSubjectsPageContent() {
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const { teachers } = useTeachers();

  const { schoolYear } = useSettings();
  const [subjects, setSubjects] = useState<Subject[]>(() => buildDefaultSubjects(schoolYear));
  const [activeGrade, setActiveGrade] = useState<GradeLevel>("Grade 1");
  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [assigningSubject, setAssigningSubject] = useState<Subject | null>(null);
  const [addingSubject, setAddingSubject] = useState(false);
  const [managingSections, setManagingSections] = useState(false);

  useMemo(() => {
    if (teachers.length === 0) return;
    setSubjects((prev) =>
      prev.map((s, i) => (i % 3 === 0 ? { ...s, teacherId: teachers[i % teachers.length].id } : s))
    );
  }, [teachers.length]);

  const filtered = subjects.filter((s) => {
    if (s.gradeLevel !== activeGrade) return false;
    if (search.trim() && !s.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (teacherFilter !== "all" && s.teacherId !== teacherFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  function updateSubject(id: string, updates: Partial<Subject>) {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

  function toggleStatus(subject: Subject) {
    updateSubject(subject.id, { status: subject.status === "Active" ? "Inactive" : "Active" });
  }

  function addSubject(newSubject: Omit<Subject, "id">) {
    const id = `${newSubject.gradeLevel}-${newSubject.name}-${newSubject.section}`
      .replace(/\s+/g, "-")
      .toLowerCase();
    setSubjects((prev) => (prev.some((s) => s.id === id) ? prev : [...prev, { ...newSubject, id }]));
    setActiveGrade(newSubject.gradeLevel);
    setAddingSubject(false);
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>Manage Subjects</h1>
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
            onClick={() => setAddingSubject(true)}
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

      <GradeLevelTabs activeGrade={activeGrade} onChange={setActiveGrade} darkMode={darkMode} />

      {filtered.length === 0 ? (
        <div className={`rounded-2xl border shadow-sm p-12 text-center ${panelBg} ${panelBorder}`}>
          <p className={`text-sm font-semibold ${textMuted}`}>No subjects match the current filters.</p>
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
          onClose={() => setEditingSubject(null)}
          onSave={(updates) => {
            updateSubject(editingSubject.id, updates);
            setEditingSubject(null);
          }}
          onManageSections={() => {
            setEditingSubject(null);
            setManagingSections(true);
          }}
        />
      )}

      {assigningSubject && (
        <AssignTeacherModal
          subject={assigningSubject}
          {...theme}
          onClose={() => setAssigningSubject(null)}
          onAssign={(updates) => {
            updateSubject(assigningSubject.id, updates);
            setAssigningSubject(null);
          }}
        />
      )}

      {addingSubject && (
        <AddSubjectModal
          subjects={subjects}
          defaultGrade={activeGrade}
          schoolYear={schoolYear}
          {...theme}
          onClose={() => setAddingSubject(false)}
          onAdd={addSubject}
          onManageSections={() => {
            setAddingSubject(false);
            setManagingSections(true);
          }}
        />
      )}

      {managingSections && (
        <ManageSectionsModal
          defaultGrade={activeGrade}
          subjects={subjects}
          {...theme}
          onClose={() => setManagingSections(false)}
        />
      )}
    </div>
  );
}