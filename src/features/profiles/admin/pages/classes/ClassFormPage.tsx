import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useClasses } from "./context/ClassesContext";
<<<<<<< Updated upstream
import { useTeachers } from "./context/TeachersContext";
import { formatTeacherName } from "./types/Teacher";
import { GRADE_LEVELS, type GradeLevel } from "../studentrecords/types/Students";
import { DAYS_OF_WEEK, type DayOfWeek, type SchedulePeriod } from "./types/Class";
import type { AdminThemeContext } from "../AdminLayout";
=======
import {
  DAYS_OF_WEEK,
  type DayOfWeek,
  type SchedulePeriod,
} from "./types/Class";
import {
  createClass,
  fetchGradeLevels,
  fetchSectionsByGrade,
  type GradeLevelOption,
  type SectionOption,
} from "./services/classes.service";
import { fetchTeachers, type TeacherOption } from "./services/classes.service";
import {
  fetchSubjectsByGrade,
  type SubjectOption,
} from "./services/classes.service";
import type { AdminThemeContext } from ".././AdminLayout";
>>>>>>> Stashed changes

interface FormState {
  gradeLevelId: number | "";
  sectionId: number | "";
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

export function ClassFormPage() {
  const { darkMode, panelBg, panelBorder, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { getClass, updateClass } = useClasses();

  const isEditing = Boolean(classId);
  const existing = classId ? getClass(classId) : undefined;

  const [gradeLevels, setGradeLevels] = useState<GradeLevelOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loadingGradeLevels, setLoadingGradeLevels] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [subjectsResolved, setSubjectsResolved] = useState(false);

  const [form, setForm] = useState<FormState>({
    gradeLevelId: existing?.gradeLevelId ?? "",
    sectionId: existing?.sectionId ?? "", 
    subjectName: "",
    adviserId: existing?.adviserId ?? "",
    schedule: existing?.schedule ?? [],
  });
  const [errors, setErrors] = useState<
    Partial<Record<"gradeLevelId" | "sectionId" | "adviserId", string>>
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

  // 2. Load teachers once on mount (para sa Class Adviser at Subject Teacher dropdowns)
  useEffect(() => {
    let active = true;
    setLoadingTeachers(true);
    fetchTeachers()
      .then((data) => {
        if (active) setTeachers(data);
      })
      .catch((err) => {
        console.error(err);
        if (active) setSubmitError("Failed to load teachers.");
      })
      .finally(() => {
        if (active) setLoadingTeachers(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // 3. Whenever gradeLevelId changes, fetch matching sections and reset sectionId
  useEffect(() => {
    if (form.gradeLevelId === "") {
      setSections([]);
      return;
    }
    let active = true;
    setLoadingSections(true);
    fetchSectionsByGrade(form.gradeLevelId)
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

  if (isEditing && !existing) {
    return (
      <section
        className={`rounded-xl border shadow-sm p-8 text-center ${panelBg} ${panelBorder}`}
      >
        <p className={`text-sm font-semibold ${textMuted}`}>
          No class found with ID <span className="font-bold">{classId}</span>.
        </p>
        <button
          onClick={() => navigate("/admin/classes")}
          className="mt-4 h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2"
          style={{ background: "#8B0D0D" }}
        >
          <ArrowLeft size={14} />
          Back to Classes
        </button>
      </section>
    );
  }

  const fieldBase = `h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const inputClasses = `w-full ${fieldBase}`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

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
      Record<"gradeLevelId" | "sectionId" | "adviserId", string>
    > = {};
    if (form.gradeLevelId === "")
      next.gradeLevelId = "Grade level is required.";
    if (form.sectionId === "") next.sectionId = "Section is required.";
    if (!form.adviserId) next.adviserId = "Class adviser is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    if (form.gradeLevelId === "" || form.sectionId === "") return;

    // period.subject holds a subject *id* (string) since it's now a dropdown —
    // resolve it back to the subject_name here before sending/saving
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
        // TODO: gawa ng /updateClass backend route — sa ngayon local update lang ito

        const selectedAdviser = teachers.find(
          (t) => String(t.id) === form.adviserId,
        );
        const adviserName = selectedAdviser
          ? `${selectedAdviser.first_name} ${selectedAdviser.last_name}`
          : "Unassigned";
        updateClass(existing.id, {
          gradeLevelId: form.gradeLevelId as number,
          gradeLevel: gradeLevels.find((g) => g.id === form.gradeLevelId)
            ?.grade_level as any,
            sectionId: form.sectionId as number,  
          section:
            sections.find((s) => s.id === form.sectionId)?.section_name ?? "",
          adviserId: form.adviserId,
          adviserName,
          schedule: cleanedSchedule,
        });
        navigate(`/admin/classes`);
      } else {
        const result = await createClass({
          gradeLevelId: form.gradeLevelId,
          sectionId: form.sectionId,
          subjectName: form.subjectName,
          adviserId: form.adviserId,
          schedule: cleanedSchedule,
        });
        navigate(`/admin/classes`);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className={`rounded-xl border shadow-sm overflow-hidden ${panelBg} ${panelBorder}`}
    >
      <div className="bg-[#8B0D0D] px-4 sm:px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/classes")}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors shrink-0"
        >
          <ArrowLeft size={16} className="text-white" />
        </button>
        <div className="min-w-0">
          <h3 className="text-white font-bold truncate">
            {isEditing ? "Edit Class" : "Add New Class"}
          </h3>
          <p className="text-xs text-white/70 mt-0.5 truncate">
            {isEditing
              ? `Updating ${existing?.gradeLevel} • ${existing?.section}`
              : "Students matching the grade and section below sync automatically"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-w-2xl">
        {submitError && (
          <div className="rounded-xl border border-[#FCA5A5] bg-[#FEE2E2] px-3 py-2 text-xs font-semibold text-[#B91C1C]">
            {submitError}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
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
                  sectionId: "", // reset section kapag nagpalit ng grade level
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
              <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                {errors.gradeLevelId}
              </p>
            )}
          </div>

          <div>
            <label className={labelClasses}>Section</label>
            <select
              className={inputClasses}
              value={form.sectionId}
              disabled={form.gradeLevelId === "" || loadingSections}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  sectionId: e.target.value ? Number(e.target.value) : "",
                }))
              }
            >
              <option value="">
                {form.gradeLevelId === ""
                  ? "Select a grade level first"
                  : loadingSections
                    ? "Loading…"
                    : sections.length === 0
                      ? "No sections found"
                      : "Select section…"}
              </option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.section_name}
                </option>
              ))}
            </select>
            {errors.sectionId && (
              <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                {errors.sectionId}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClasses}>Class Adviser</label>
          <select
            className={inputClasses}
            value={form.adviserId}
            disabled={loadingTeachers}
            onChange={(e) => setForm({ ...form, adviserId: e.target.value })}
          >
            <option value="">
              {loadingTeachers ? "Loading…" : "Select a teacher…"}
            </option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.last_name}, {t.first_name}
              </option>
            ))}
          </select>
          {errors.adviserId && (
            <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
              {errors.adviserId}
            </p>
          )}
        </div>

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
                className={`rounded-xl border p-3 sm:p-4 space-y-3 ${panelBorder}`}
              >
                <div className="grid sm:grid-cols-2 gap-3">
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
                  <select
                    className={inputClasses}
                    value={period.teacherId}
                    disabled={loadingTeachers}
                    onChange={(e) =>
                      updatePeriod(period.id, { teacherId: e.target.value })
                    }
                  >
                    <option value="">
                      {loadingTeachers ? "Loading…" : "Subject teacher…"}
                    </option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.last_name}, {t.first_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(period.id, day)}
                      className={`w-9 h-9 rounded-lg text-[11px] font-bold transition-colors shrink-0 ${
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
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        schedule: f.schedule.filter((p) => p.id !== period.id),
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

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/admin/classes")}
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
            disabled={submitting}
            className="h-10 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-2 transition-colors hover:bg-[#6B0000] disabled:opacity-60"
            style={{ background: "#8B0D0D" }}
          >
            <Save size={14} />
            {submitting ? "Saving…" : isEditing ? "Save Changes" : "Add Class"}
          </button>
        </div>
      </form>
    </section>
  );
}
