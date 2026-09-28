import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useStudents } from "./context/StudentsContext";
import { Dropdown } from "./components/Studentsfilterbar";
import { StudentSearchInput } from "./components/StudentSearchInput";
import { StudentsTable } from "./components/Studentstable";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { GRADE_LEVELS, GENDERS, type Gender, type GradeLevel, type Student } from "./types/Students";
import type { AdminThemeContext } from ".././AdminLayout";
import { StudentImportExportToolbar } from "./components/StudentImportExportToolbar";
import { useToast } from "../../../../../shared/context/ToastContext";

export function StudentRecordsPage() {
  const navigate = useNavigate();
  const { students, deleteStudent, addStudents } = useStudents();
  const { showToast } = useToast();

  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();

  const [gradeFilter, setGradeFilter] = useState<GradeLevel | "All Grades">(
    "All Grades",
  );
  const [genderFilter, setGenderFilter] = useState<Gender | "All Genders">(
    "All Genders",
  );
  const [search, setSearch] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (gradeFilter !== "All Grades" && s.gradeLevel !== gradeFilter)
        return false;
      if (genderFilter !== "All Genders" && s.gender !== genderFilter)
        return false;
      if (q) {
        const haystack =
          `${s.studentId} ${s.lastName} ${s.firstName} ${s.middleName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [students, gradeFilter, genderFilter, search]);

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;

  async function handleConfirmDelete() {
    if (!studentToDelete) return;
    try {
      await deleteStudent(studentToDelete.dbId);
      setStudentToDelete(null);
      showToast("Student deleted successfully!", "success");
    } catch (error) {
      console.error("Delete Error:", error);
      showToast(error instanceof Error ? error.message : "Failed to delete student.");
    }
  }

  return (
    <div className="w-full min-h-full pb-0">
      <div className="w-full px-6 lg:px-8 pt-6 space-y-4">
        {/* Page header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
                Student Records
              </h1>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                {filtered.length} of {students.length} student
                {students.length === 1 ? "" : "s"} shown
              </p>
            </div>
          </div>
        </div>

        {/* Search bar with dropdown filters + import/export + add button beside it */}
        <StudentSearchInput
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          value={search}
          onChange={setSearch}
        >
          <Dropdown
            label="Grade level filter"
            value={gradeFilter}
            options={["All Grades", ...GRADE_LEVELS]}
            onChange={setGradeFilter}
            darkMode={darkMode}
          />
          <Dropdown
            label="Gender filter"
            value={genderFilter}
            options={["All Genders", ...GENDERS]}
            onChange={setGenderFilter}
            darkMode={darkMode}
          />
          <StudentImportExportToolbar
            filteredStudents={filtered}
            allStudentIds={students.map((s) => s.studentId)}
            allLrns={students.map((s) => s.lrn)}
            onImportStudents={(newStudents) => addStudents(newStudents)}
            darkMode={darkMode}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />
          <button
            onClick={() => navigate("new")}
            className="h-8 px-3 rounded-lg text-[11px] font-extrabold text-white flex items-center gap-1.5 shrink-0 transition-colors hover:bg-[#6B0000]"
            style={{ background: "#8B0D0D" }}
          >
            <UserPlus size={13} />
            Add New Student
          </button>
        </StudentSearchInput>

        {/* Table card */}
        <section className={cardClasses} aria-label="Student records">
          <div
            className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${panelBorder}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <p
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textPrimary}`}
              >
                All Students
              </p>
              <p className={`truncate text-[11px] font-medium ${textMuted}`}>
                · {filtered.length} of {students.length} shown
              </p>
            </div>
          </div>

          <StudentsTable
            students={filtered}
            darkMode={darkMode}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            onEdit={(student) => navigate(`${student.id}/edit`)}
            onDelete={(student) => setStudentToDelete(student)}
          />
        </section>
      </div>

      {studentToDelete && (
        <ConfirmDeleteModal
          student={studentToDelete}
          darkMode={darkMode}
          onCancel={() => setStudentToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}