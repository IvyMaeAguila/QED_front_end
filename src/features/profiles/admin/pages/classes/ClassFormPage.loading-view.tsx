import { AccountSelect } from "@shared/components/AccountSelect";

import { useToast } from "@shared/context/ToastContext";
import { LoadingFormValue } from "@shared/loading/LoadingFormValue";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { rememberRows,skeletonRows } from "@shared/loading/reservations";
import { ArrowLeft,Plus,Save,Trash2 } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { WorkflowStepper } from "../../../shared/components/WorkflowStepper";
import type { AdminThemeContext } from ".././AdminLayout";
import { useClasses } from "./context/ClassesContext";
import {
createClass,
fetchAllTeachers,
fetchGradeLevels,
fetchSectionsByGrade,
fetchSubjectsByGrade,
updateClassApi,
type GradeLevelOption,
type SectionOption,
type SubjectOption,
type TeacherOption,
} from "./services/classes.service";
import {
DAYS_OF_WEEK,
type DayOfWeek,
type SchedulePeriod,
} from "./types/Class";

const ACCENT = "var(--color-maroon)";
const CLASS_FORM_STEPS = [
  { name: "Details", desc: "Set grade, section, and adviser" },
  { name: "Schedule", desc: "Add class periods" },
  { name: "Review", desc: "Confirm the class setup" },
] as const;

interface FormState {
  gradeLevelId: number | "";
  section: string;
  room: string;
  subjectName: string | "";
  adviserId: string;
  schedule: SchedulePeriod[];
}

function emptyPeriod(): SchedulePeriod {
  return {
    id: crypto.randomUUID(),
    subject: "",
    teacherId: "",
    days: [],
    startTime: "07:30",
    endTime: "08:30",
  };
}

interface TeacherDropdownProps {
  label: string;
  value: string;
  options: TeacherOption[];
  disabled: boolean;
  loading: boolean;
  valueLoading?: boolean;
  darkMode: boolean;
  className: string;
  onChange: (teacherId: string) => void;
}

function TeacherDropdown({label,value,options,disabled,loading,valueLoading=false,darkMode,className,onChange}:TeacherDropdownProps) {
 const pending=valueLoading || (loading && Boolean(value) && !options.some(teacher=>String(teacher.id)===value));
 return <LoadingFormValue loading={pending} name={label === "Class adviser" ? "class-adviser-value" : "class-period-teacher"} width={label === "Class adviser" ? "12ch" : "10ch"}><AccountSelect data-account-select="" aria-label={label} className={className} data-dropdown-dark={darkMode} disabled={disabled} value={value} onChange={event=>onChange(event.target.value)}><option value="">Select a teacher…</option>{options.map(teacher=><option key={teacher.id} value={teacher.id}>{teacher.last_name}, {teacher.first_name}</option>)}</AccountSelect></LoadingFormValue>;
}


function useClassFormPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { getClass, refreshClasses, loading: classesLoading, error: classesError } = useClasses();
  const { showToast } = useToast();

  const isEditing = Boolean(classId);
  const existing = classId ? getClass(classId) : undefined;
  const [choiceAttempt, setChoiceAttempt] = useState(0);
  const [choiceError, setChoiceError] = useState<string | null>(null);
  const recordPending = isEditing && classesLoading && !existing && !classesError;
  const loadError = classesError ?? choiceError;
  const [currentStep, setCurrentStep] = useState(0);

  const [allTeachers, setAllTeachers] = useState<TeacherOption[]>([]); // for Subject Teacher
  const [loadingAllTeachers, setLoadingAllTeachers] = useState(true);

  const [gradeLevels, setGradeLevels] = useState<GradeLevelOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loadingGradeLevels, setLoadingGradeLevels] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [subjectsResolved, setSubjectsResolved] = useState(false);

  const [form, setForm] = useState<FormState>({
    gradeLevelId: existing?.gradeLevelId ?? "",
    section: existing?.section ?? "",
    room: existing?.room ?? "",
    subjectName: "",
    adviserId: existing?.adviserId ?? "",
    schedule: existing?.schedule ?? [],
  });
  const seededRecord = useRef(existing ? classId : undefined);
  const [errors, setErrors] = useState<
    Partial<Record<"gradeLevelId" | "section" | "adviserId", string>>
  >({});

  // ── Shared design tokens (same as StudentFormPage) ──
  const cardClasses = `rounded-[12px] border shadow-xs overflow-visible transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `flex flex-col gap-2 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${panelBorder}`;
  const sectionTitleClasses = `qed-type-page-title ${textPrimary}`;

  if (isEditing && !existing && !classesLoading && !classesError) {
    return { content: ((
      <div className="max-w-7xl mx-auto pb-12">
        <section
          className={`rounded-[12px] border shadow-xs p-8 text-center ${panelBg} ${panelBorder}`}
        >
          <p className={`text-sm font-semibold ${textMuted}`}>
            No class found with ID <span className="font-bold">{classId}</span>.
          </p>
          <button
            onClick={() => navigate("/admin/classes")}
            className="mt-4 h-9 px-4 rounded-lg text-xs font-bold text-white inline-flex items-center gap-2"
            style={{ background: ACCENT }}
          >
            <ArrowLeft size={14} />
            Back to Classes
          </button>
        </section>
      </div>
    )), scope: { existing, classesLoading, seededRecord, classId, setSubjectsResolved, setForm, setLoadingGradeLevels, fetchGradeLevels, setGradeLevels, setChoiceError, choiceAttempt, setLoadingAllTeachers, fetchAllTeachers, setAllTeachers, form, setSections, setLoadingSections, fetchSectionsByGrade, setSubjects, setLoadingSubjects, fetchSubjectsByGrade, isEditing, subjectsResolved, subjects } };
  }

  const fieldBase = `h-10 px-3 rounded-lg border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-maroon-light"
      : "bg-brand-light border-border-subtle text-[#111827] focus:border-maroon-light"
  }`;
  const inputClasses = `w-full ${fieldBase}`;
  const labelClasses = `block text-xs font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function updatePeriod(id: string, updates: Partial<SchedulePeriod>) {
    setForm((f) => ({
      ...f,
      schedule: f.schedule.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }

  function toggleDay(periodId: string, day: DayOfWeek) {
    setForm((f) => ({
      ...f,
      schedule: f.schedule.map((p) =>
        p.id === periodId
          ? {
              ...p,
              days: p.days.includes(day)
                ? p.days.filter((d) => d !== day)
                : [...p.days, day],
            }
          : p,
      ),
    }));
  }

  function validate(): boolean {
    const next: Partial<
      Record<"gradeLevelId" | "section" | "adviserId", string>
    > = {};
    if (form.gradeLevelId === "")
      next.gradeLevelId = "Grade level is required.";
    if (!form.adviserId) next.adviserId = "Class adviser is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (classesLoading || loadError || loadingGradeLevels || loadingAllTeachers || loadingSections || loadingSubjects) return;
    setSubmitError(null);
    if (!isEditing && currentStep < CLASS_FORM_STEPS.length - 1) {
      if (currentStep === 0 && !validate()) return;
      setCurrentStep((step) => step + 1);
      return;
    }
    if (!validate()) return;
    if (form.gradeLevelId === "") return;

    const cleanedSchedule = form.schedule
      .filter((p) => p.subject.trim() && p.teacherId && p.days.length > 0)
      .map((p) => ({
        ...p,
        subject:
          subjects.find((s) => String(s.id) === p.subject)?.subject_name ??
          p.subject,
      }));

    setSubmitting(true);
    try {
      if (isEditing && existing) {
        await updateClassApi(existing.id, {
          gradeLevelId: form.gradeLevelId,
          section: form.section,
          room: form.room,
          subjectName: form.subjectName,
          adviserId: form.adviserId,
          schedule: cleanedSchedule,
        });
        refreshClasses();
        navigate(`/admin/classes`);
        showToast("Class updated successfully!", "success");
      } else {
        await createClass({
          gradeLevelId: form.gradeLevelId,
          section: form.section,
          room: form.room,
          subjectName: form.subjectName,
          adviserId: form.adviserId,
          schedule: cleanedSchedule,
        });
        refreshClasses();
        navigate(`/admin/classes`);
        showToast("Class created successfully!", "success");
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      showToast(
        err instanceof Error ? err.message : "Failed to add class.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return { content: ((
    <div className="w-full space-y-4 pb-8 sm:space-y-6 sm:pb-12">
      <section className={cardClasses} aria-label="Class form" data-sk-region="class-form">
        {/* Card header — back button + icon/title on the left, helper text on the right */}
        <div className={cardHeaderClasses}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/classes")}
              aria-label="Go back"
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
                {isEditing ? "Edit Class" : "Add New Class"}
              </h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
                {isEditing
                  ? <LoadingRegion as="span" loading={recordPending} variable name="class-form-description" skeleton={null} frame={pending => <><span data-sk-static="" data-sk-region="class-form-description-prefix">Updating</span>{" "}{pending ? <SkeletonParagraph field={`class-${classId}-description`} width="26ch" inline /> : <span data-sk-field={`class-${classId}-description`}>{existing?.gradeLevel} - {existing?.section}</span>}</>}>{null}</LoadingRegion>
                  : "Students matching the grade and section below sync automatically"}
              </p>
            </div>
          </div>
        </div>

        {loadError && <LoadingRegion loading={false} error={loadError} retry={() => { if (classesError) refreshClasses(); if (choiceError) { setChoiceError(null); setChoiceAttempt(value => value + 1); } }} skeleton={null} className="p-4 sm:p-6" name="class-form-error">{null}</LoadingRegion>}
        {!loadError && <form onSubmit={handleSubmit} className={isEditing ? "w-full space-y-5 p-4 sm:p-6" : "grid w-full gap-4 p-4 sm:p-6 md:grid-cols-[16rem_minmax(0,1fr)]"}>
          {!isEditing && (
            <aside className={`rounded-[12px] p-4 sm:p-5 ${darkMode ? "bg-[#0B1120]/60" : "bg-brand-light"}`}>
              <h3 className={`mb-4 text-sm font-semibold md:mb-6 ${textPrimary}`}>Add Class</h3>
              <WorkflowStepper darkMode={darkMode} current={currentStep} steps={CLASS_FORM_STEPS} />
            </aside>
          )}
          <div className={isEditing ? "space-y-5" : `w-full min-w-0 space-y-5 rounded-[12px] border p-4 sm:p-6 ${panelBorder} md:col-start-2 md:max-w-5xl`}>
          {submitError && (
            <div className="rounded-lg border border-[#FCA5A5] bg-[#FEE2E2] px-3 py-2 text-xs font-semibold text-[#B91C1C]">
              {submitError}
            </div>
          )}

          {(isEditing || currentStep === 0) && <>
          <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Grade Level</label>
              <LoadingFormValue loading={recordPending || (loadingGradeLevels && Boolean(form.gradeLevelId) && !gradeLevels.some(grade => grade.id === form.gradeLevelId))} name="class-form-gradeLevelId" width="7ch"><AccountSelect data-account-select=""
                className={inputClasses}
                value={form.gradeLevelId}
                disabled={loadingGradeLevels}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    gradeLevelId: e.target.value ? Number(e.target.value) : "",
                    section: "", // reset section kapag nagpalit ng grade level
                    // reset subject ng bawat period dahil grade-specific na yung subject list
                    schedule: f.schedule.map((p) => ({ ...p, subject: "" })),
                  }))
                }
              >
                <option value="">
                  {loadingGradeLevels ? "Select grade level…" : "Select grade level…"}
                </option>
                {gradeLevels.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.grade_level}
                  </option>
                ))}
              </AccountSelect></LoadingFormValue>
              {errors.gradeLevelId && (
                <p className="text-xs font-semibold text-[#B91C1C] mt-1">
                  {errors.gradeLevelId}
                </p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Section (Optional)</label>
              <LoadingFormValue loading={recordPending || (loadingSections && Boolean(form.section) && !sections.some(section => section.section_name === form.section))} name="class-form-section" width="10ch"><AccountSelect data-account-select=""
                className={`${inputClasses} disabled:opacity-60 disabled:cursor-not-allowed`}
                value={form.section}
                disabled={form.gradeLevelId === "" || loadingSections}
                onChange={(e) =>
                  setForm((f) => ({ ...f, section: e.target.value }))
                }
              >
                <option value="">
                  {form.gradeLevelId === ""
                    ? "Select a grade level first"
                    : loadingSections
                      ? "Select section…"
                      : sections.length === 0
                        ? "No available section"
                        : "Select section…"}
                </option>
                {sections.map((s) => (
                  <option key={s.id} value={s.section_name}>
                    {s.section_name}
                  </option>
                ))}
              </AccountSelect></LoadingFormValue>
              {errors.section && (
                <p className="text-xs font-semibold text-[#B91C1C] mt-1">
                  {errors.section}
                </p>
              )}
            </div>
          </div>

          <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Class Adviser</label>
              <TeacherDropdown
                label="Class adviser"
                value={form.adviserId}
                options={allTeachers}
                disabled={loadingAllTeachers || recordPending}
                loading={loadingAllTeachers}
                valueLoading={recordPending}
                darkMode={darkMode}
                className={inputClasses}
                onChange={(adviserId) => setForm((current) => ({ ...current, adviserId }))}
              />
              {errors.adviserId && (
                <p className="text-xs font-semibold text-[#B91C1C] mt-1">
                  {errors.adviserId}
                </p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Room Number</label>
              <LoadingFormValue loading={recordPending} name="class-form-room" width="8ch"><input
                className={inputClasses}
                value={form.room}
                onChange={(e) =>
                  setForm((f) => ({ ...f, room: e.target.value }))
                }
                placeholder="NEL 101"
              /></LoadingFormValue>
            </div>
          </div>
          </>}

          {(isEditing || currentStep === 1) && <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <label className={`${labelClasses} mb-0`}>Class Schedule</label>
              <button
                type="button"
                disabled={recordPending}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    schedule: [...f.schedule, emptyPeriod()],
                  }))
                }
                className={`h-8 px-3 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 shrink-0 transition-colors ${
                  darkMode
                    ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                    : "border-border-subtle text-[#374151] hover:bg-brand-light"
                }`}
              >
                <Plus size={13} />
                Add Period
              </button>
            </div>

            <LoadingRegion loading={recordPending} variable name="class-form-schedule" skeleton={null} onSettled={() => rememberRows(`class-${classId}-periods`, form.schedule.length)} frame={pending => <>            {!pending && form.schedule.length === 0 && (
              <p className={`text-xs font-semibold ${textMuted}`}>
                No periods added yet.
              </p>
            )}

            <div className="space-y-3">
              {(pending ? Array.from({ length: skeletonRows(`class-${classId}-periods`, undefined, 200) }, (_, index) => ({ id: `pending-${index}`, subject: "", teacherId: "", startTime: "", endTime: "", days: [] as DayOfWeek[] })) : form.schedule).map((period) => (
                <div
                  key={period.id}
                  data-sk-region="class-form-period" data-sk-item=""
                  className={`rounded-[12px] border p-3 sm:p-4 space-y-3 ${panelBorder}`}
                >
                  <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
                    <LoadingFormValue loading={pending || (loadingSubjects && Boolean(period.subject) && !subjects.some(subject => String(subject.id) === period.subject))} name="class-period-subject" width="14ch"><AccountSelect data-account-select=""
                      className={inputClasses}
                      value={period.subject}
                      disabled={form.gradeLevelId === "" || loadingSubjects}
                      onChange={(e) =>
                        updatePeriod(period.id, { subject: e.target.value })
                      }
                    >
                      <option value="">
                        {form.gradeLevelId === ""
                          ? "Select a grade level first"
                          : loadingSubjects
                            ? "Select subject…"
                            : subjects.length === 0
                              ? "No subjects found"
                              : "Select subject…"}
                      </option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.subject_name}
                        </option>
                      ))}
                    </AccountSelect></LoadingFormValue>
                    <TeacherDropdown
                      label="Subject teacher"
                      value={period.teacherId}
                      options={allTeachers}
                      disabled={loadingAllTeachers || pending}
                      loading={loadingAllTeachers}
                      valueLoading={pending}
                      darkMode={darkMode}
                      className={inputClasses}
                      onChange={(teacherId) => updatePeriod(period.id, { teacherId })}
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day}
                        type="button"
                        disabled={pending}
                        onClick={() => toggleDay(period.id, day)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                          period.days.includes(day)
                            ? "text-white"
                            : darkMode
                              ? "bg-[#0B1120] text-[#D1D5DB] border border-[#374151]"
                              : "bg-brand-light text-[#64748B] border border-border-subtle"
                        }`}
                        style={
                          period.days.includes(day)
                            ? { background: "var(--brand-secondary)" }
                            : undefined
                        }
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <LoadingFormValue loading={pending} name="class-period-startTime" width="7ch" className="w-33"><input
                      type="time"
                      className={`${fieldBase} w-33`}
                      value={period.startTime}
                      onChange={(e) =>
                        updatePeriod(period.id, { startTime: e.target.value })
                      }
                    /></LoadingFormValue>
                    <span className={`text-xs font-bold ${textMuted}`}>to</span>
                    <LoadingFormValue loading={pending} name="class-period-endTime" width="8ch" className="w-33"><input
                      type="time"
                      className={`${fieldBase} w-33`}
                      value={period.endTime}
                      onChange={(e) =>
                        updatePeriod(period.id, { endTime: e.target.value })
                      }
                    /></LoadingFormValue>

                    <button
                      type="button"
                      aria-label="Remove period"
                      disabled={pending}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          schedule: f.schedule.filter(
                            (p) => p.id !== period.id,
                          ),
                        }))
                      }
                      className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div></>}>{null}</LoadingRegion>
          </div>
          </div>}

          {!isEditing && currentStep === 2 && (
            <section className={`rounded-[12px] border p-4 sm:p-5 ${panelBorder} ${darkMode ? "bg-white/[0.03]" : "bg-brand-light"}`} aria-labelledby="class-review-title">
              <h3 id="class-review-title" className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>Review class setup</h3>
              <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  ["Grade level", gradeLevels.find((grade) => String(grade.id) === String(form.gradeLevelId))?.grade_level ?? "—"],
                  ["Section", form.section || "Unassigned"],
                  ["Class adviser", allTeachers.find((teacher) => String(teacher.id) === form.adviserId)?.last_name ?? "—"],
                  ["Room", form.room || "—"],
                  ["Schedule periods", String(form.schedule.length)],
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
              onClick={() => navigate("/admin/classes")}
              className={`h-10 w-full rounded-lg border px-4 text-xs font-bold transition-colors sm:w-auto ${
                darkMode
                  ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                  : "border-border-subtle text-[#374151] hover:bg-brand-light"
              }`}
            >
              Cancel
            </button>
            {!isEditing && currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((step) => step - 1)}
                className={`h-10 w-full rounded-lg border px-4 text-xs font-bold transition-colors sm:w-auto ${darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-border-subtle text-[#374151] hover:bg-brand-light"}`}
              >
                Back
              </button>
            )}
            </div>
            <button
              type="submit"
              disabled={submitting || classesLoading || Boolean(loadError) || loadingGradeLevels || loadingAllTeachers || loadingSections || loadingSubjects}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-5 text-xs font-bold text-white transition-colors hover:bg-maroon-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              style={{ background: ACCENT }}
            >
              {(isEditing || currentStep === CLASS_FORM_STEPS.length - 1) && <Save size={14} />}
              {!isEditing && currentStep < CLASS_FORM_STEPS.length - 1
                ? "Continue"
                : submitting
                ? "Saving…"
                : isEditing
                  ? "Save Changes"
                  : "Add Class"}
            </button>
          </div>
          </div>
        </form>}
      </section>
    </div>
  )), scope: { existing, classesLoading, seededRecord, classId, setSubjectsResolved, setForm, setLoadingGradeLevels, fetchGradeLevels, setGradeLevels, setChoiceError, choiceAttempt, setLoadingAllTeachers, fetchAllTeachers, setAllTeachers, form, setSections, setLoadingSections, fetchSectionsByGrade, setSubjects, setLoadingSubjects, fetchSubjectsByGrade, isEditing, subjectsResolved, subjects } };
}




export type ClassFormPageEffectScope = ReturnType<typeof useClassFormPageState>["scope"];
export type ClassFormPageRouteProps = Record<string, never>;
export function ClassFormPageComposition(props: object & { effects?: (scope: ClassFormPageEffectScope) => import("react").ReactNode }) {
 const state = useClassFormPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
