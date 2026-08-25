import { useState, type FormEvent, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, Save, IdCard } from "lucide-react";
import { useStudents } from "./context/StudentsContext";
import { GENDERS, type Gender } from "./types/Students";
import type { AdminThemeContext } from "../AdminLayout";
import {
  fetchGradeLevels,
  type DBGradeLevelResponse,
  fetchSectionByGrade,
  type DBSectionResponse,
} from "./services/grade-section.service";
import { studentService } from "./services/student-record.service";
import { useToast } from "../../../../../shared/context/ToastContext";

const ACCENT = "#8B0D0D";

interface FormState {
  studentId: string;   // 👈 iisa na lang — ito ang "Student ID" display field (student_number)
  lastName: string;
  firstName: string;
  middleName: string;
  lrn: string;
  gender: Gender;
  gradeLevel: string;
  section: string;
}

const emptyForm: FormState = {
  studentId: "",
  lastName: "",
  firstName: "",
  middleName: "",
  lrn: "",
  gender: "Male",
  gradeLevel: "",
  section: "",
};

const LRN_PATTERN = /^\d{12}$/;
const ID_PATTERN = /^[A-Z]\d{2}-\d{4}$/;

export function StudentFormPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { getStudent, updateStudent, students, refetch } = useStudents();
  const { showToast } = useToast();

  const isEditing = Boolean(studentId);
  const existing = studentId ? getStudent(studentId) : undefined;

  const [gradeLevels, setGradeLevels] = useState<DBGradeLevelResponse[]>([]);
  const [loadingGrades, setLoadingGrades] = useState<boolean>(true);
  const [gradeError, setGradeError] = useState<string | null>(null);

  const [sections, setSections] = useState<DBSectionResponse[]>([]);
  const [loadingSections, setLoadingSections] = useState<boolean>(false);

  const [form, setForm] = useState<FormState>(
    existing
      ? {
          studentId: existing.studentId,
          lastName: existing.lastName,
          firstName: existing.firstName,
          middleName: existing.middleName,
          lrn: existing.lrn,
          gender: existing.gender,
          gradeLevel: String(existing.gradeLevelId),  
          section: String(existing.sectionId),   
        }
      : emptyForm,
  );

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadGrades() {
      try {
        const data = await fetchGradeLevels();
        if (isMounted) {
          setGradeLevels(data);
          if (!isEditing && data.length > 0) {
            setForm((prev) => ({ ...prev, gradeLevel: String(data[0].id) }));
          }
        }
      } catch (err) {
        if (isMounted) {
          setGradeError(err instanceof Error ? err.message : "Failed to load grade levels");
        }
      } finally {
        if (isMounted) setLoadingGrades(false);
      }
    }

    loadGrades();
    return () => {
      isMounted = false;
    };
  }, [isEditing]);

  useEffect(() => {
    if (!form.gradeLevel) {
      setSections([]);
      return;
    }

    let isMounted = true;

    async function loadSections() {
      setLoadingSections(true);
      try {
        const data = await fetchSectionByGrade(form.gradeLevel);
        if (isMounted) {
          setSections(data);

          // 👇 kapag editing, panatilihin ang existing section kung nasa listahan pa rin
          const stillValid = existing && data.some((s) => String(s.id) === form.section);
          if (!stillValid && data.length > 0) {
            setForm((prev) => ({ ...prev, section: String(data[0].id) }));
          } else if (data.length === 0) {
            setForm((prev) => ({ ...prev, section: "" }));
          }
        }
      } catch (err) {
        console.error("Failed loading sections:", err);
        if (isMounted) {
          setSections([]);
          setForm((prev) => ({ ...prev, section: "" }));
        }
      } finally {
        if (isMounted) setLoadingSections(false);
      }
    }

    loadSections();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.gradeLevel]);

  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
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

    if (!form.studentId.trim()) {
      next.studentId = "Student ID is required.";
    } else if (!ID_PATTERN.test(form.studentId.trim())) {
      next.studentId = "Student ID must be in the format A##-####.";
    } else if (
      !isEditing &&
      students.some((s) => s.id.toLowerCase() === form.studentId.trim().toLowerCase())
    ) {
      next.studentId = "This Student ID is already taken.";
    }

    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lrn.trim()) {
      next.lrn = "LRN is required.";
    } else if (!LRN_PATTERN.test(form.lrn.trim())) {
      next.lrn = "LRN must be exactly 12 digits.";
    }
    if (!form.section.trim()) next.section = "Section is required.";
    if (!form.gradeLevel.trim()) next.gradeLevel = "Grade level is required.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      studentId: form.studentId.trim(),
      lrn: form.lrn.trim(),
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      gender: form.gender,
      gradeLevel: (form.gradeLevel),
      section: (form.section),
    };

    try {
      if (isEditing && existing) {
        await updateStudent(existing.dbId, payload as any);
        showToast("Student updated successfully!", "success");
        navigate(`/admin/students`);
      } else {
        await studentService.addNewStudent(payload);
        showToast("Student added successfully!", "success");
        await refetch(); // kunin ulit ang buong listahan galing backend
        navigate(`/admin/students`);
      }
    } catch (error) {
      console.error("API Connection Error:", error);
      showToast(
    error instanceof Error ? error.message : "Can't connect to the server. Make sure the backend is working.",
    "error",
  );
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
            {isEditing ? `Updating ${existing?.studentId}'s record` : "Enter a unique student ID for this record"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-xl">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Student ID</label>
              <input
                className={inputClasses}
                value={form.studentId}
                // disabled={isEditing}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                placeholder="A23-0001"
              />
              {errors.studentId && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.studentId}</p>}
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
            </div>
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
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Grade Level</label>
              <select
                className={inputClasses}
                value={form.gradeLevel}
                onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
              >
                {loadingGrades && <option value="">Loading...</option>}
                {gradeError && <option value="">Failed to load grades</option>}
                {gradeLevels.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.grade_level}
                  </option>
                ))}
              </select>
              {errors.gradeLevel && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.gradeLevel}</p>}
            </div>
            <div>
              <label className={labelClasses}>Section</label>
              <select
                className={inputClasses}
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              >
                {loadingSections && <option value="">Loading...</option>}
                {!loadingSections && sections.length === 0 && <option value="">No sections available</option>}
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.section_name}
                  </option>
                ))}
              </select>
              {errors.section && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.section}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/admin/students")}
              className={`h-10 px-4 rounded-xl text-xs font-bold border transition-colors ${
                darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
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