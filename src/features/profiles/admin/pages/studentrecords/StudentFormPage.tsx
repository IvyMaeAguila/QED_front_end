import { useState, type FormEvent } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, Save, IdCard } from "lucide-react";
import { useStudents } from "./context/StudentsContext";
import { GRADE_LEVELS, GENDERS, type Gender, type GradeLevel } from "./types/Students";
import type { AdminThemeContext } from "../AdminLayout";

const ACCENT = "#8B0D0D";

interface FormState {
  id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  lrn: string;
  gender: Gender;
  gradeLevel: GradeLevel;
  section: string;
}

const emptyForm: FormState = {
  id: "",
  lastName: "",
  firstName: "",
  middleName: "",
  lrn: "",
  gender: "Male",
  gradeLevel: "Grade 1",
  section: "",
};

const LRN_PATTERN = /^\d{12}$/; 
const ID_PATTERN = /^[A-Z]\d{2}-\d{4}$/;

export function StudentFormPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { getStudent, addStudent, updateStudent, students } = useStudents();

  const isEditing = Boolean(studentId);
  const existing = studentId ? getStudent(studentId) : undefined;

  const [form, setForm] = useState<FormState>(
    existing
      ? {
          id: existing.id,
          lastName: existing.lastName,
          firstName: existing.firstName,
          middleName: existing.middleName,
          lrn: existing.lrn,
          gender: existing.gender,
          gradeLevel: existing.gradeLevel,
          section: existing.section,
        }
      : emptyForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // cardClasses mirrors StudentRecordsPage exactly
  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  
  // Custom header matching StudentRecordsPage layout, but including the Back button and proper spacing
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 ${textPrimary}`;

  if (isEditing && !existing) {
    return (
      <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 pb-12">
        <section className={`rounded-xl border shadow-xs p-8 text-center ${panelBg} ${panelBorder}`}>
          <p className={`text-sm font-semibold ${textMuted}`}>
            No student found with ID <span className="font-bold">{studentId}</span>.
          </p>
          <button
            onClick={() => navigate("/admin/students")}
            className="mt-4 h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2"
            style={{ background: ACCENT }}
          >
            <ArrowLeft size={14} />
            Back to Student Records
          </button>
        </section>
      </div>
    );
  }

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    
    if (!form.id.trim()) {
      next.id = "Student ID is required.";
    } else if (!ID_PATTERN.test(form.id.trim())) {
      next.id = "Student ID must be in the format A##-####.";
    } else if (!isEditing && students.some((s) => s.id.toLowerCase() === form.id.trim().toLowerCase())) {
      next.id = "This Student ID is already taken.";
    }

    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lrn.trim()) {
      next.lrn = "LRN is required.";
    } else if (!LRN_PATTERN.test(form.lrn.trim())) {
      next.lrn = "LRN must be exactly 12 digits.";
    }
    if (!form.section.trim()) next.section = "Section is required.";
    
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      id: form.id.trim(),
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lrn: form.lrn.trim(),
      gender: form.gender,
      gradeLevel: form.gradeLevel,
      section: form.section.trim(),
    };

    if (isEditing && existing) {
      updateStudent(existing.id, payload);
      navigate(`/admin/students/${payload.id}`);
    } else {
      addStudent(payload);
      navigate(`/admin/students/${payload.id}`);
    }
  }

  return (
    <div className="max-w-7xl mx-auto mt-6 space-y-6 pb-12 px-4 sm:px-6">
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/students")}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
                darkMode ? "border-[#374151] hover:bg-white/10 text-white" : "border-[#E5E7EB] hover:bg-[#F6F7FB] text-[#374151]"
              }`}
            >
              <ArrowLeft size={14} />
            </button>
            <h2 className={sectionTitleClasses}>
              <IdCard size={15} style={{ color: ACCENT }} />
              {isEditing ? "Edit Student Record" : "Add New Student Record"}
            </h2>
          </div>
          <span className={`text-xs font-semibold ${textMuted}`}>
            {isEditing ? `Updating record ${existing?.id}` : "Enter a unique student ID for this record"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-xl">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Student ID</label>
              <input
                className={inputClasses}
                value={form.id}
                maxLength={8}
                disabled={isEditing}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="STU-2026-001"
              />
              {errors.id && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.id}</p>}
            </div>
            <div>
              <label className={labelClasses}>LRN</label>
              <input
                className={inputClasses}
                value={form.lrn}
                maxLength={12}
                inputMode="numeric"
                onChange={(e) => setForm({ ...form, lrn: e.target.value.replace(/\D/g, "") })}
                placeholder="123456789012"
              />
              {errors.lrn && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.lrn}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Last Name</label>
              <input
                className={inputClasses}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Dela Cruz"
              />
              {errors.lastName && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.lastName}</p>}
            </div>
            <div>
              <label className={labelClasses}>First Name</label>
              <input
                className={inputClasses}
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Juan"
              />
              {errors.firstName && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.firstName}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Middle Name</label>
              <input
                className={inputClasses}
                value={form.middleName}
                onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                placeholder="Manalo"
              />
              {errors.middleName && (
                <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.middleName}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>Section</label>
              <input
                className={inputClasses}
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                placeholder="A"
              />
              {errors.section && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.section}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Gender</label>
              <select
                className={inputClasses}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Grade Level</label>
              <select
                className={inputClasses}
                value={form.gradeLevel}
                onChange={(e) => setForm({ ...form, gradeLevel: e.target.value as GradeLevel })}
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/admin/students")}
              className={`h-10 px-4 rounded-xl text-xs font-bold border transition-colors ${
                darkMode
                  ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                  : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 transition-colors hover:bg-[#6B0000]"
              style={{ background: ACCENT }}
            >
              <Save size={14} />
              {isEditing ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}