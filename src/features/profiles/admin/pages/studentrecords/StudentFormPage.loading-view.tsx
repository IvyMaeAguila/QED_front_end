import { SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingFormValue } from "@shared/loading/LoadingFormValue";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { ArrowLeft,Save } from "lucide-react";
import { useRef,useState,type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { useToast } from "../../../../../shared/context/ToastContext";
import { WorkflowStepper } from "../../../shared/components/WorkflowStepper";
import type { AdminThemeContext } from "../AdminLayout";
import { useStudents } from "./context/StudentsContext";
import {
fetchGradeLevels,
fetchSectionByGrade,
type DBGradeLevelResponse,
type DBSectionResponse,
} from "./services/grade-section.service";
import { studentService } from "./services/student-record.service";
import { GENDERS,type Gender } from "./types/Students";

const ACCENT = "var(--color-maroon)";
const STUDENT_FORM_STEPS = [
  { name: "Details", desc: "Basic student information" },
  { name: "Placement", desc: "Grade level and section" },
  { name: "Review", desc: "Confirm the record" },
] as const;

interface FormState {
  studentId: string; // 👈 iisa na lang — ito ang "Student ID" display field (student_number)
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

function useStudentFormPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { getStudent, updateStudent, students, refetch, loading, error } = useStudents();
  const { showToast } = useToast();

  const isEditing = Boolean(studentId);
  const existing = studentId ? getStudent(studentId) : undefined;

  const [choicesAttempt, setChoicesAttempt] = useState(0);
  const [sectionError, setSectionError] = useState<string | null>(null);
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
          middleName: existing.middleName ?? "",
          lrn: existing.lrn,
          gender: existing.gender,
          gradeLevel: String(existing.gradeLevelId),
          section: existing.sectionId != null ? String(existing.sectionId) : "",
        }
      : emptyForm,
  );

  const seededRecord = useRef(existing ? studentId : undefined);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [currentStep, setCurrentStep] = useState(0);

  // 👇 kahit isa lang ang section, dapat pa rin pwedeng piliin ng user (hindi disabled).
  // Disabled/hindi selectable lang talaga kapag walang available na section.
  const sectionIsSelectable = sections.length >= 1;

  const cardClasses = `rounded-[12px] border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `flex flex-col gap-2 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${panelBorder}`;
  const sectionTitleClasses = `qed-type-page-title ${textPrimary}`;

  if (isEditing && !existing && !loading && !error) {
    return { content: ((
      <div className="w-full pb-8 sm:pb-12">
        <section
          className={`rounded-[12px] border shadow-xs p-8 text-center ${panelBg} ${panelBorder}`}
        >
          <p className={`text-sm font-semibold ${textMuted}`}>
            No student found with ID{" "}
            <span className="font-bold">{studentId}</span>.
          </p>
          <button
            onClick={() => navigate("/admin/students")}
            className="mt-4 h-9 px-4 rounded-lg text-xs font-bold text-white inline-flex items-center gap-2"
            style={{ background: ACCENT }}
          >
            <ArrowLeft size={14} />
            Back to Student Records
          </button>
        </section>
      </div>
    )), scope: { existing, loading, seededRecord, studentId, setForm, setLoadingGrades, setGradeError, fetchGradeLevels, setGradeLevels, isEditing, choicesAttempt, form, setSections, setSectionError, setLoadingSections, fetchSectionByGrade } };
  }

  const inputClasses = `w-full h-10 px-3 rounded-lg border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-maroon-light"
      : "bg-brand-light border-border-subtle text-[#111827] focus:border-maroon-light"
  }`;
  const labelClasses = `block text-xs font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function validate(step?: number): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (step === undefined || step === 0) {
      if (!form.studentId.trim()) {
        next.studentId = "Student ID is required.";
      } else if (!ID_PATTERN.test(form.studentId.trim())) {
        next.studentId = "Student ID must be in the format A##-####.";
      } else if (
        !isEditing &&
        students.some(
          (s) => s.id.toLowerCase() === form.studentId.trim().toLowerCase(),
        )
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
    }
    if (step === undefined || step === 1) {
      // A section is required whenever at least one section is available.
      if (sectionIsSelectable && !form.section.trim())
        next.section = "Section is required.";
      if (!form.gradeLevel.trim()) next.gradeLevel = "Grade level is required.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || loadingGrades || loadingSections || error || gradeError || sectionError) return;
    if (!validate()) return;

    const payload = {
      studentId: form.studentId.trim(),
      lrn: form.lrn.trim(),
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      middleName: form.middleName ? form.middleName : null ,
      gender: form.gender,
      gradeLevel: form.gradeLevel,
      section: form.section ? form.section : null,
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
        error instanceof Error
          ? error.message
          : "Can't connect to the server. Make sure the backend is working.",
        "error",
      );
    }
  }

  function handleContinue() {
    if (loading || error || (currentStep === 1 && (loadingGrades || loadingSections || gradeError || sectionError))) return;
    if (validate(currentStep)) setCurrentStep((step) => step + 1);
  }

  return { content: ((
    <div className="w-full space-y-4 pb-8 sm:space-y-6 sm:pb-12">
      <section className={cardClasses} aria-label="Student record form" data-sk-region="student-form">
        <div className={cardHeaderClasses}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/students")}
              aria-label="Go back to student records"
              className={`system-back-button shrink-0 ${
                darkMode
                  ? "border-[#374151] hover:bg-white/10 text-white"
                  : "border-border-subtle hover:bg-brand-light text-[#374151]"
              }`}
            >
              <ArrowLeft />
            </button>
            <div className="min-w-0">
              <h1 className={sectionTitleClasses}>
                {isEditing ? "Edit Student Record" : "Add New Student Record"}
              </h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
                {isEditing
                  ? <LoadingRegion as="span" loading={loading && !existing} variable name="student-form-subtitle" skeleton={null} frame={pending => <>Updating {pending ? <SkeletonText width="9ch" className="inline-block align-middle" /> : existing?.studentId}'s record</>}>{null}</LoadingRegion>
                  : "Enter a unique student ID for this record"}
              </p>
            </div>
          </div>
        </div>

        {error && <LoadingRegion loading={false} error={error} retry={refetch} skeleton={null} className="p-4 sm:p-6" name="student-form-error">{null}</LoadingRegion>}
        {(!isEditing || !error) && <form onSubmit={handleSubmit} className="grid w-full gap-4 p-4 sm:p-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className={`rounded-[12px] p-4 sm:p-5 ${darkMode ? "bg-[#0B1120]/60" : "bg-brand-light"}`}>
            <h3 className={`mb-4 text-sm font-semibold lg:mb-6 ${textPrimary}`}>Add Student</h3>
            <WorkflowStepper darkMode={darkMode} current={currentStep} steps={STUDENT_FORM_STEPS} />
          </aside>

          <div className={`min-w-0 space-y-5 rounded-[12px] border p-4 sm:p-6 ${panelBorder}`}>

          {currentStep === 0 && <div className="max-w-4xl space-y-5">
          <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Student ID</label>
              <LoadingFormValue loading={isEditing && loading && !existing} name="student-form-studentId" width="9ch"><input
                className={inputClasses}
                value={form.studentId}
                // disabled={isEditing}
                onChange={(e) =>
                  setForm({ ...form, studentId: e.target.value })
                }
                placeholder="A23-0001"
              /></LoadingFormValue>
              {errors.studentId && (
                <p className="text-xs font-semibold text-[#B91C1C] mt-1">
                  {errors.studentId}
                </p>
              )}
            </div>
            <div>
              <label className={labelClasses}>LRN</label>
              <LoadingFormValue loading={isEditing && loading && !existing} name="student-form-lrn" width="12ch"><input
                className={inputClasses}
                value={form.lrn}
                maxLength={12}
                inputMode="numeric"
                onChange={(e) =>
                  setForm({ ...form, lrn: e.target.value.replace(/\D/g, "") })
                }
                placeholder="123456789012"
              /></LoadingFormValue>
              {errors.lrn && (
                <p className="text-xs font-semibold text-[#B91C1C] mt-1">
                  {errors.lrn}
                </p>
              )}
            </div>
          </div>

          <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Last Name</label>
              <LoadingFormValue loading={isEditing && loading && !existing} name="student-form-lastName" width="14ch"><input
                className={inputClasses}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Dela Cruz"
              /></LoadingFormValue>
              {errors.lastName && (
                <p className="text-xs font-semibold text-[#B91C1C] mt-1">
                  {errors.lastName}
                </p>
              )}
            </div>
            <div>
              <label className={labelClasses}>First Name</label>
              <LoadingFormValue loading={isEditing && loading && !existing} name="student-form-firstName" width="11ch"><input
                className={inputClasses}
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                placeholder="Juan"
              /></LoadingFormValue>
              {errors.firstName && (
                <p className="text-xs font-semibold text-[#B91C1C] mt-1">
                  {errors.firstName}
                </p>
              )}
            </div>
          </div>

          <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Middle Name</label>
              <LoadingFormValue loading={isEditing && loading && !existing} name="student-form-middleName" width="13ch"><input
                className={inputClasses}
                value={form.middleName ?? ""}
                onChange={(e) =>
                  setForm({ ...form, middleName: e.target.value })
                }
                placeholder="Manalo"
              /></LoadingFormValue>
            </div>
            <div>
              <label className={labelClasses}>Gender</label>
              <LoadingFormValue loading={isEditing && loading && !existing} name="student-form-gender" width="6ch"><select
                className={inputClasses}
                value={form.gender}
                onChange={(e) =>
                  setForm({ ...form, gender: e.target.value as Gender })
                }
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select></LoadingFormValue>
            </div>
          </div>
          </div>}

          {currentStep === 1 && (
          <div className="max-w-3xl space-y-4">
          {(gradeError || sectionError) && <LoadingRegion loading={false} error={gradeError ?? sectionError} retry={() => setChoicesAttempt(value => value + 1)} skeleton={null} name="student-placement-error">{null}</LoadingRegion>}
          <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Grade Level</label>
              <LoadingFormValue loading={(isEditing && loading && !existing) || (loadingGrades && Boolean(form.gradeLevel))} name="student-form-gradeLevel" width="7ch"><select
                className={inputClasses}
                disabled={loadingGrades || Boolean(gradeError)}
                value={form.gradeLevel}
                onChange={(e) =>
                  setForm({ ...form, gradeLevel: e.target.value })
                }
              >
                {loadingGrades && <option value="">Select grade level…</option>}

                {!loadingGrades && gradeError && (
                  <option value="">Failed to load grades</option>
                )}

                {!loadingGrades && !gradeError && gradeLevels.length === 0 && (
                  <option value="">No grade levels found</option>
                )}

                {/* 👇 lalabas lang ito sa "Add" mode. Sa "Edit" mode, hindi na kailangan
                    dahil naka-set na agad ang form.gradeLevel galing sa existing student. */}
                {!loadingGrades &&
                  !gradeError &&
                  gradeLevels.length > 0 &&
                  !isEditing && <option value="">Select grade level…</option>}

                {!loadingGrades &&
                  gradeLevels.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.grade_level}
                    </option>
                  ))}
              </select></LoadingFormValue>
              {errors.gradeLevel && (
                <p className="text-xs font-semibold text-[#B91C1C] mt-1">
                  {errors.gradeLevel}
                </p>
              )}
            </div>
            <div>
              <label className={labelClasses}>Section</label>
              <LoadingFormValue loading={(isEditing && loading && !existing) || (loadingSections && Boolean(form.gradeLevel))} name="student-form-section" width="10ch"><select
                className={`${inputClasses} ${!sectionIsSelectable ? "opacity-60 cursor-not-allowed" : ""}`}
                value={form.section}
                disabled={!sectionIsSelectable || loadingSections || Boolean(sectionError)}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              >
                {loadingSections && <option value="">Select section</option>}
                {!loadingSections && sections.length === 0 && (
                  <option value="">No section available</option>
                )}
                {!loadingSections && sections.length > 0 && (
                  <option value="">Select section</option>
                )}
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.section_name}
                  </option>
                ))}
              </select></LoadingFormValue>
              {errors.section && (
                <p className="text-xs font-semibold text-[#B91C1C] mt-1">
                  {errors.section}
                </p>
              )}
            </div>
          </div>
          </div>
          )}

          {currentStep === 2 && (
            <section className={`rounded-[12px] border p-4 sm:p-5 ${panelBorder} ${darkMode ? "bg-white/[0.03]" : "bg-brand-light"}`} aria-labelledby="student-review-title">
              <h3 id="student-review-title" className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>Review student record</h3>
              <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  ["Student ID", form.studentId || "—"],
                  ["LRN", form.lrn || "—"],
                  ["Student name", [form.lastName, form.firstName, form.middleName].filter(Boolean).join(", ") || "—"],
                  ["Gender", form.gender],
                  ["Grade level", gradeLevels.find((grade) => String(grade.id) === form.gradeLevel)?.grade_level ?? "—"],
                  ["Section", sections.find((section) => String(section.id) === form.section)?.section_name ?? "Unassigned"],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>{label}</dt>
                    <dd className={`mt-1 break-words text-sm font-semibold ${textPrimary}`}>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-5">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/students")}
              className={`h-10 w-full rounded-lg border px-4 text-xs font-bold transition-colors sm:w-auto ${
                darkMode
                  ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                  : "border-border-subtle text-[#374151] hover:bg-brand-light"
              }`}
            >
              Cancel
            </button>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((step) => step - 1)}
                className={`h-10 w-full rounded-lg border px-4 text-xs font-bold transition-colors sm:w-auto ${darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-border-subtle text-[#374151] hover:bg-brand-light"}`}
              >
                Back
              </button>
            )}
            </div>
            {currentStep < 2 ? (
              <button
                key="student-continue"
                type="button"
                onClick={handleContinue}
                disabled={loading || Boolean(error) || (currentStep === 1 && (loadingGrades || loadingSections || Boolean(gradeError) || Boolean(sectionError)))}
                className="h-10 w-full rounded-lg px-5 text-xs font-bold text-white transition-colors hover:bg-maroon-light disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                style={{ background: ACCENT }}
              >
                Continue
              </button>
            ) : (
            <button
              key="student-save"
              type="submit"
              disabled={loading || loadingGrades || loadingSections || Boolean(error || gradeError || sectionError)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-xs font-bold text-white transition-colors hover:bg-maroon-light sm:w-auto"
              style={{ background: ACCENT }}
            >
              <Save size={14} />
              {isEditing ? "Save Changes" : "Add Student"}
            </button>
            )}
          </div>
          </div>
        </form>}
      </section>
    </div>
  )), scope: { existing, loading, seededRecord, studentId, setForm, setLoadingGrades, setGradeError, fetchGradeLevels, setGradeLevels, isEditing, choicesAttempt, form, setSections, setSectionError, setLoadingSections, fetchSectionByGrade } };
}


export type StudentFormPageEffectScope = ReturnType<typeof useStudentFormPageState>["scope"];
export type StudentFormPageRouteProps = Record<string, never>;
export function StudentFormPageComposition(props: object & { effects?: (scope: StudentFormPageEffectScope) => import("react").ReactNode }) {
 const state = useStudentFormPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
