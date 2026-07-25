import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { IdCard } from "lucide-react";
import { useStudents } from "./context/StudentsContext";
import { StudentsFilterBar } from "./components/Studentsfilterbar";
import { StudentsTable } from "./components/Studentstable";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import type { Gender, GradeLevel, Student } from "./types/Students";
import type { AdminThemeContext } from "../shared/AdminLayout";
import { StudentImportExportToolbar } from "./components/StudentImportExportToolbar";

const ACCENT = "#8B0D0D";

export function StudentRecordsPage() {
  const navigate = useNavigate();
  const { students, deleteStudent, addStudents } = useStudents();

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
          `${s.id} ${s.lastName} ${s.firstName} ${s.middleName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [students, gradeFilter, genderFilter, search]);


  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 ${textPrimary}`;

  return (
    <div className="max-w-7xl mx-auto mt-6 space-y-6 pb-12 px-4 sm:px-6">
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <h2 className={sectionTitleClasses}>
            <IdCard size={15} style={{ color: ACCENT }} />
            Student Records
          </h2>
          <span className={`text-xs font-semibold ${textMuted}`}>
            {filtered.length} of {students.length} student
            {students.length === 1 ? "" : "s"} shown
          </span>
        </div>

        <StudentsFilterBar
          darkMode={darkMode}
          panelBorder={panelBorder}
          gradeFilter={gradeFilter}
          genderFilter={genderFilter}
          search={search}
          onGradeChange={setGradeFilter}
          onGenderChange={setGenderFilter}
          onSearchChange={setSearch}
          onAddNew={() => navigate("new")}
        />

        <StudentImportExportToolbar
          filteredStudents={filtered}
          allStudentIds={students.map((s) => s.id)}
          allLrns={students.map((s) => s.lrn)}
          onImportStudents={(newStudents) => addStudents(newStudents)}
          darkMode={darkMode}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />

        <StudentsTable
          students={filtered}
          darkMode={darkMode}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          onView={(student) => navigate(`/admin/students/${student.id}`)}
          onEdit={(student) => navigate(`${student.id}/edit`)}
          onDelete={(student) => setStudentToDelete(student)}
        />
      </section>

      {studentToDelete && (
        <ConfirmDeleteModal
          student={studentToDelete}
          darkMode={darkMode}
          onCancel={() => setStudentToDelete(null)}
          onConfirm={() => {
            deleteStudent(studentToDelete.id);
            setStudentToDelete(null);
          }}
        />
      )}
    </div>
  );
}