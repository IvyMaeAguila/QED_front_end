import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, ChevronDown, Save, Plus, Trash2 } from "lucide-react";
import { useClasses } from "./context/ClassesContext";
import {
  DAYS_OF_WEEK,
  type DayOfWeek,
  type SchedulePeriod,
} from "./types/Class";
import {
  createClass,
  updateClassApi,
  fetchGradeLevels,
  fetchSectionsByGrade,
  type GradeLevelOption,
  type SectionOption,
} from "./services/classes.service";
import {
  fetchAllTeachers,
  type TeacherOption,
} from "./services/classes.service";
import {
  fetchSubjectsByGrade,
  type SubjectOption,
} from "./services/classes.service";
import type { AdminThemeContext } from ".././AdminLayout";
import { useToast } from "@shared/context/ToastContext";
import { WorkflowStepper } from "../../../shared/components/WorkflowStepper";

const ACCENT = "#8B0D0D";
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
  darkMode: boolean;
  className: string;
  onChange: (teacherId: string) => void;
}

function TeacherDropdown({
  label,
  value,
  options,
  disabled,
  loading,
  darkMode,
  className,
  onChange,
}: TeacherDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find((teacher) => String(teacher.id) === value);
  const selectedLabel = selected
    ? `${selected.last_name}, ${selected.first_name}`
    : loading
      ? "Loading…"
      : "Select a teacher…";

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setActiveIndex(Math.max(0, options.findIndex((teacher) => String(teacher.id) === value)));
        setOpen(true);
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      if (options.length > 0) {
        setActiveIndex((index) => (index + direction + options.length) % options.length);
      }
    } else if (event.key === "Enter" && open && options[activeIndex]) {
      event.preventDefault();
      onChange(String(options[activeIndex].id));
      setOpen(false);
    }
  }

  return (
    <div className="relative w-full" ref={rootRef}>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onClick={() => {
          setActiveIndex(Math.max(0, options.findIndex((teacher) => String(teacher.id) === value)));
          setOpen((isOpen) => !isOpen);
        }}
        className={`${className} flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className={selected ? "truncate" : "truncate text-[#8B929E]"}>{selectedLabel}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={`${label} options`}
          className={`absolute left-0 top-full z-[100] mt-1 max-h-64 w-full overflow-y-auto rounded-lg border py-1 shadow-xl ${darkMode ? "border-[#374151] bg-[#111827]" : "border-[#E5E7EB] bg-white"}`}
        >
          {options.map((teacher, index) => {
            const teacherId = String(teacher.id);
            const isSelected = teacherId === value;
            const isActive = index === activeIndex;
            return (
              <button
                key={teacher.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onChange(teacherId);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? darkMode ? "bg-white/10" : "bg-[#F1F5F9]"
                    : darkMode ? "hover:bg-white/5" : "hover:bg-[#F8FAFC]"
                } ${darkMode ? "text-white" : "text-[#111827]"}`}
              >
                {teacher.last_name}, {teacher.first_name}
              </button>
            );
          })}
          {options.length === 0 && (
            <p className={`px-3 py-2 text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#64748B]"}`}>
              No teachers available
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ClassFormPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { getClass, refreshClasses } = useClasses();
  const { showToast } = useToast();

  const isEditing = Boolean(classId);
  const existing = classId ? getClass(classId) : undefined;
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
  const [errors, setErrors] = useState<
    Partial<Record<"gradeLevelId" | "section" | "adviserId", string>>
  >({});

  // 1. Load grade levels once on mount
  useEffect(() => {
    let active = true;
    setLoadingGradeLevels(true);
    fetchGradeLevels()
      .then((data) => {
        if (active) setGradeLevels(data);
      })
      .catch((err) => {
        console.error(err);
        if (active) setSubmitError("Failed to load grade levels.");
      })
      .finally(() => {
        if (active) setLoadingGradeLevels(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingAllTeachers(true);
    fetchAllTeachers()
      .then((data) => {
        if (active) setAllTeachers(data);
      })
      .catch((err) => {
        console.error(err);
        if (active) setSubmitError("Failed to load teachers.");
      })
      .finally(() => {
        if (active) setLoadingAllTeachers(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // 3. Whenever gradeLevelId changes, fetch matching sections
  useEffect(() => {
    if (form.gradeLevelId === "") {
      setSections([]);
      return;
    }
    let active = true;
    setLoadingSections(true);
    fetchSectionsByGrade(form.gradeLevelId, existing?.id)
      .then((data) => {
        if (active) setSections(data);
      })
      .catch((err) => {
        console.error(err);
        if (active) setSubmitError("Failed to load sections.");
      })
      .finally(() => {
        if (active) setLoadingSections(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.gradeLevelId]);

  // 4. Whenever gradeLevelId changes, fetch matching subjects (para sa period dropdowns)
  useEffect(() => {
    if (form.gradeLevelId === "") {
      setSubjects([]);
      return;
    }
    let active = true;
    setLoadingSubjects(true);
    fetchSubjectsByGrade(form.gradeLevelId)
      .then((data) => {
        if (active) setSubjects(data);
      })
      .catch((err) => {
        console.error(err);
        if (active) setSubmitError("Failed to load subjects.");
      })
      .finally(() => {
        if (active) setLoadingSubjects(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.gradeLevelId]);

  useEffect(() => {
    if (!isEditing || subjectsResolved) return;
    if (subjects.length === 0) return;

    setForm((f) => ({
      ...f,
      schedule: f.schedule.map((p) => {
        const match = subjects.find((s) => s.subject_name === p.subject);
        return match ? { ...p, subject: String(match.id) } : p;
      }),
    }));
    setSubjectsResolved(true);
  }, [subjects, isEditing, subjectsResolved]);

  // ── Shared design tokens (same as StudentFormPage) ──
  const cardClasses = `rounded-[12px] border shadow-xs overflow-visible transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `flex flex-col gap-2 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${panelBorder}`;
  const sectionTitleClasses = `qed-type-page-title ${textPrimary}`;

  if (isEditing && !existing) {
    return (
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
    );
  }

  const fieldBase = `h-10 px-3 rounded-lg border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
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

  return (
    <div className="w-full space-y-4 pb-8 sm:space-y-6 sm:pb-12">
      <section className={cardClasses}>
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
                  : "border-[#E5E7EB] hover:bg-[#F6F7FB] text-[#374151]"
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
                  ? `Updating ${existing?.gradeLevel} - ${existing?.section}`
                  : "Students matching the grade and section below sync automatically"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={isEditing ? "w-full space-y-5 p-4 sm:p-6" : "grid w-full gap-4 p-4 sm:p-6 md:grid-cols-[16rem_minmax(0,1fr)]"}>
          {!isEditing && (
            <aside className={`rounded-[12px] p-4 sm:p-5 ${darkMode ? "bg-[#0B1120]/60" : "bg-[#F8FAFC]"}`}>
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
              <select
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
                  {loadingGradeLevels ? "Loading…" : "Select grade level…"}
                </option>
                {gradeLevels.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.grade_level}
                  </option>
                ))}
              </select>
              {errors.gradeLevelId && (
                <p className="text-xs font-semibold text-[#B91C1C] mt-1">
                  {errors.gradeLevelId}
                </p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Section (Optional)</label>
              <select
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
                      ? "Loading…"
                      : sections.length === 0
                        ? "No available section"
                        : "Select section…"}
                </option>
                {sections.map((s) => (
                  <option key={s.id} value={s.section_name}>
                    {s.section_name}
                  </option>
                ))}
              </select>
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
                disabled={loadingAllTeachers}
                loading={loadingAllTeachers}
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
              <input
                className={inputClasses}
                value={form.room}
                onChange={(e) =>
                  setForm((f) => ({ ...f, room: e.target.value }))
                }
                placeholder="NEL 101"
              />
            </div>
          </div>
          </>}

          {(isEditing || currentStep === 1) && <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <label className={`${labelClasses} mb-0`}>Class Schedule</label>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    schedule: [...f.schedule, emptyPeriod()],
                  }))
                }
                className={`h-8 px-3 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 shrink-0 transition-colors ${
                  darkMode
                    ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                    : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
                }`}
              >
                <Plus size={13} />
                Add Period
              </button>
            </div>

            {form.schedule.length === 0 && (
              <p className={`text-xs font-semibold ${textMuted}`}>
                No periods added yet.
              </p>
            )}

            <div className="space-y-3">
              {form.schedule.map((period) => (
                <div
                  key={period.id}
                  className={`rounded-[12px] border p-3 sm:p-4 space-y-3 ${panelBorder}`}
                >
                  <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
                    <select
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
                            ? "Loading…"
                            : subjects.length === 0
                              ? "No subjects found"
                              : "Select subject…"}
                      </option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.subject_name}
                        </option>
                      ))}
                    </select>
                    <TeacherDropdown
                      label="Subject teacher"
                      value={period.teacherId}
                      options={allTeachers}
                      disabled={loadingAllTeachers}
                      loading={loadingAllTeachers}
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
                        onClick={() => toggleDay(period.id, day)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                          period.days.includes(day)
                            ? "text-white"
                            : darkMode
                              ? "bg-[#0B1120] text-[#D1D5DB] border border-[#374151]"
                              : "bg-[#F8FAFC] text-[#64748B] border border-[#E5E7EB]"
                        }`}
                        style={
                          period.days.includes(day)
                            ? { background: "#1D70D6" }
                            : undefined
                        }
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <input
                      type="time"
                      className={`${fieldBase} w-33`}
                      value={period.startTime}
                      onChange={(e) =>
                        updatePeriod(period.id, { startTime: e.target.value })
                      }
                    />
                    <span className={`text-xs font-bold ${textMuted}`}>to</span>
                    <input
                      type="time"
                      className={`${fieldBase} w-33`}
                      value={period.endTime}
                      onChange={(e) =>
                        updatePeriod(period.id, { endTime: e.target.value })
                      }
                    />

                    <button
                      type="button"
                      aria-label="Remove period"
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
            </div>
          </div>
          </div>}

          {!isEditing && currentStep === 2 && (
            <section className={`rounded-[12px] border p-4 sm:p-5 ${panelBorder} ${darkMode ? "bg-white/[0.03]" : "bg-[#F8FAFC]"}`} aria-labelledby="class-review-title">
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
                  : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
              }`}
            >
              Cancel
            </button>
            {!isEditing && currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((step) => step - 1)}
                className={`h-10 w-full rounded-lg border px-4 text-xs font-bold transition-colors sm:w-auto ${darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"}`}
              >
                Back
              </button>
            )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-5 text-xs font-bold text-white transition-colors hover:bg-[#6B0000] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
        </form>
      </section>
    </div>
  );
}
