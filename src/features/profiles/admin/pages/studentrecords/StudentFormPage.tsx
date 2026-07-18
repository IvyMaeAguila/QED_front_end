import { useState, type FormEvent } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useStudents } from "./context/StudentsContext";
import { GRADE_LEVELS, GENDERS, type  Gender, type GradeLevel } from "./types/Students";
import type { AdminThemeContext } from "../shared/AdminLayout";

interface FormState {
  lastName: string;
  firstName: string;
  middleName: string;
  lrn: string;
  gender: Gender;
  gradeLevel: GradeLevel;
  section: string;
}

const emptyForm: FormState = {
  lastName: "",
  firstName: "",
  middleName: "",
  lrn: "",
  gender: "Male",
  gradeLevel: "Grade 1",
  section: "",
};

const LRN_PATTERN = /^\d{12}$/; 

export function StudentFormPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { getStudent, addStudent, updateStudent } = useStudents();

  const isEditing = Boolean(studentId);
  const existing = studentId ? getStudent(studentId) : undefined;

  const [form, setForm] = useState<FormState>(
    existing
      ? {
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

  if (isEditing && !existing) {
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

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
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
      navigate(`/admin/students/${existing.id}`);
    } else {
      const created = addStudent(payload);
      navigate(`/admin/students/${created.id}`);
    }
  }

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
          <h3 className="text-white font-bold">{isEditing ? "Edit Student" : "Add New Student"}</h3>
          <p className="text-xs text-white/70 mt-0.5">
            {isEditing ? `Updating record ${existing?.id}` : "This student will be assigned the next available ID"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-xl">
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

        <div className="grid sm:grid-cols-2 gap-4">
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
            style={{ background: "#8B0D0D" }}
          >
            <Save size={14} />
            {isEditing ? "Save Changes" : "Add Student"}
          </button>
        </div>
      </form>
    </section>
  );
}