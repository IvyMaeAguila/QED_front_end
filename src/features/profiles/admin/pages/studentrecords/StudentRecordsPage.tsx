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

  return (
    <section
      className={`rounded-xl border shadow-sm overflow-hidden ${panelBg} ${panelBorder}`}
    >
      <div className="bg-[#8B0D0D] px-5 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold">Student Records</h3>
          <p className="text-xs text-white/70 mt-1">
            {filtered.length} of {students.length} student
            {students.length === 1 ? "" : "s"} shown
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#C98A2B] flex items-center justify-center text-white shrink-0">
          <IdCard size={19} />
        </div>
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
        onView={(student) => navigate(`${student.id}`)}
        onEdit={(student) => navigate(`${student.id}/edit`)}
        onDelete={(student) => setStudentToDelete(student)}
      />

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
    </section>
  );
}
