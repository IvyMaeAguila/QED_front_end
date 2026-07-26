import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useStudents } from "./context/StudentsContext";
import { formatFullName } from "./types/Students";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import type { AdminThemeContext } from "../../AdminLayout";

export function StudentViewPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { getStudent, deleteStudent } = useStudents();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const student = studentId ? getStudent(studentId) : undefined;

  if (!student) {
    return (
      <section className={`rounded-xl border shadow-sm p-8 text-center ${panelBg} ${panelBorder}`}>
        <p className={`text-sm font-semibold ${textMuted}`}>
          No student found with ID <span className="font-bold">{studentId}</span>.
        </p>
        <button
          onClick={() => navigate("/admin/students")}
          className="mt-4 h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2"
          style={{ background: "#8B0D0D" }}
        >
          <ArrowLeft size={14} />
          Back to Student Records
        </button>
      </section>
    );
  }

  const fields: { label: string; value: string }[] = [
    { label: "Student ID", value: student.id },
    { label: "Full Name", value: formatFullName(student) },
    { label: "Gender", value: student.gender },
    { label: "Grade Level", value: student.gradeLevel },
    { label: "Section", value: student.section },
  ];

  return (
    <section className={`rounded-xl border shadow-sm overflow-hidden ${panelBg} ${panelBorder}`}>
      <div className="bg-[#8B0D0D] px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/students")}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors shrink-0"
        >
          <ArrowLeft size={16} className="text-white" />
        </button>
        <div>
          <h3 className="text-white font-bold">{formatFullName(student)}</h3>
          <p className="text-xs text-white/70 mt-0.5">{student.id}</p>
        </div>
      </div>

      <div className="p-6">
        <div className="grid sm:grid-cols-2 gap-5 max-w-xl">
          {fields.map((f) => (
            <div key={f.label}>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${textMuted}`}>{f.label}</p>
              <p className={`mt-1 text-base font-bold ${textPrimary}`}>{f.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => navigate(`/admin/students/${student.id}/edit`)}
            className="h-10 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 transition-colors hover:bg-[#6B0000]"
            style={{ background: "#8B0D0D" }}
          >
            <Pencil size={14} />
            Edit Student
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            className={`h-10 px-4 rounded-xl text-xs font-bold border inline-flex items-center gap-2 transition-colors ${
              darkMode
                ? "border-[#7F1D1D] text-[#F87171] hover:bg-[#7F1D1D]/20"
                : "border-[#FEE2E2] text-[#B91C1C] hover:bg-[#FEE2E2]"
            }`}
          >
            <Trash2 size={14} />
            Remove Student
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDeleteModal
          student={student}
          darkMode={darkMode}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            deleteStudent(student.id);
            navigate("/admin/students");
          }}
        />
      )}
    </section>
  );
}