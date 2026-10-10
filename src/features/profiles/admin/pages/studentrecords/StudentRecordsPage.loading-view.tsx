import { UserPlus } from "lucide-react";
import { useMemo,useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { useToast } from "../../../../../shared/context/ToastContext";
import type { AdminThemeContext } from ".././AdminLayout";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { StudentImportExportToolbar } from "./components/StudentImportExportToolbar";
import { StudentSearchInput } from "./components/StudentSearchInput";
import { Dropdown } from "./components/Studentsfilterbar";
import { StudentsTable } from "./components/Studentstable";
import { useStudents } from "./context/StudentsContext";
import { GENDERS,GRADE_LEVELS,type Gender,type GradeLevel,type Student } from "./types/Students";

function useStudentRecordsPageState() {
  const navigate = useNavigate();
  const { students, deleteStudent, addStudents, loading, error, refetch } = useStudents();
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

  return { content: ((
    <div className="w-full min-h-full pb-0">
      <div className="w-full space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div>
              <h1 className={`qed-type-page-title ${textPrimary}`}>
                Student Records
              </h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
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
            className="h-8 px-3 rounded-lg text-xs font-extrabold text-white flex items-center gap-1.5 shrink-0 transition-colors hover:bg-maroon-light"
            style={{ background: "var(--color-maroon)" }}
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
              <p className={`truncate text-xs font-medium ${textMuted}`}>
                · {filtered.length} of {students.length} shown
              </p>
            </div>
          </div>

          <StudentsTable
            loading={loading} error={error} retry={refetch} view={JSON.stringify(["admin/students", gradeFilter, genderFilter, search])}
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
  )), scope: {  } };
}

export type StudentRecordsPageEffectScope = ReturnType<typeof useStudentRecordsPageState>["scope"];
export type StudentRecordsPageRouteProps = Record<string, never>;
export function StudentRecordsPageComposition(props: object & { effects?: (scope: StudentRecordsPageEffectScope) => import("react").ReactNode }) {
 const state = useStudentRecordsPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
