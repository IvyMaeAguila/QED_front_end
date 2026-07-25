import { useState, type FormEvent } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useClasses } from "./context/ClassesContext";
import { useTeachers } from "./context/TeachersContext";
import { formatTeacherName } from "./types/Teacher";
import { GRADE_LEVELS, type GradeLevel } from "../studentrecords/types/Students";
import { DAYS_OF_WEEK, type DayOfWeek, type SchedulePeriod } from "./types/Class";
import type { AdminThemeContext } from "../shared/AdminLayout";

interface FormState {
  gradeLevel: GradeLevel;
  section: string;
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
  const { darkMode, panelBg, panelBorder, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { getClass, addClass, updateClass } = useClasses();
  const { teachers } = useTeachers();

  const isEditing = Boolean(classId);
  const existing = classId ? getClass(classId) : undefined;

  const [form, setForm] = useState<FormState>(
    existing
      ? {
          gradeLevel: existing.gradeLevel,
          section: existing.section,
          adviserId: existing.adviserId,
          schedule: existing.schedule,
        }
      : { gradeLevel: "Grade 1", section: "", adviserId: "", schedule: [] }
  );
  const [errors, setErrors] = useState<Partial<Record<"section" | "adviserId", string>>>({});

  if (isEditing && !existing) {
    return (
      <section className={`rounded-xl border shadow-sm p-8 text-center ${panelBg} ${panelBorder}`}>
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
          ? { ...p, days: p.days.includes(day) ? p.days.filter((d) => d !== day) : [...p.days, day] }
          : p
      ),
    }));
  }

  function validate(): boolean {
    const next: Partial<Record<"section" | "adviserId", string>> = {};
    if (!form.section.trim()) next.section = "Section is required.";
    if (!form.adviserId) next.adviserId = "Class adviser is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      gradeLevel: form.gradeLevel,
      section: form.section.trim(),
      adviserId: form.adviserId,
      schedule: form.schedule.filter((p) => p.subject.trim() && p.teacherId && p.days.length > 0),
    };

    if (isEditing && existing) {
      updateClass(existing.id, payload);
      navigate(`/admin/classes/${existing.id}`);
    } else {
      const created = addClass(payload);
      navigate(`/admin/classes/${created.id}`);
    }
  }

  return (
    <section className={`rounded-xl border shadow-sm overflow-hidden ${panelBg} ${panelBorder}`}>
      <div className="bg-[#8B0D0D] px-4 sm:px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/classes")}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors shrink-0"
        >
          <ArrowLeft size={16} className="text-white" />
        </button>
        <div className="min-w-0">
          <h3 className="text-white font-bold truncate">{isEditing ? "Edit Class" : "Add New Class"}</h3>
          <p className="text-xs text-white/70 mt-0.5 truncate">
            {isEditing
              ? `Updating ${existing?.gradeLevel} • ${existing?.section}`
              : "Students matching the grade and section below sync automatically"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Grade Level</label>
            <select
              className={inputClasses}
              value={form.gradeLevel}
              onChange={(e) => setForm({ ...form, gradeLevel: e.target.value as GradeLevel })}
            >
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
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

        <div>
          <label className={labelClasses}>Class Adviser</label>
          <select
            className={inputClasses}
            value={form.adviserId}
            onChange={(e) => setForm({ ...form, adviserId: e.target.value })}
          >
            <option value="">Select a teacher…</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{formatTeacherName(t)}</option>
            ))}
          </select>
          {errors.adviserId && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.adviserId}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 gap-2">
            <label className={`${labelClasses} mb-0`}>Class Schedule</label>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, schedule: [...f.schedule, emptyPeriod()] }))}
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
            <p className={`text-xs font-semibold ${textMuted}`}>No periods added yet.</p>
          )}

          <div className="space-y-3">
            {form.schedule.map((period) => (
              <div key={period.id} className={`rounded-xl border p-3 sm:p-4 space-y-3 ${panelBorder}`}>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    className={inputClasses}
                    value={period.subject}
                    onChange={(e) => updatePeriod(period.id, { subject: e.target.value })}
                    placeholder="Subject (e.g. Math)"
                  />
                  <select
                    className={inputClasses}
                    value={period.teacherId}
                    onChange={(e) => updatePeriod(period.id, { teacherId: e.target.value })}
                  >
                    <option value="">Subject teacher…</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{formatTeacherName(t)}</option>
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
                      style={period.days.includes(day) ? { background: "#1D70D6" } : undefined}
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
                    onChange={(e) => updatePeriod(period.id, { startTime: e.target.value })}
                  />
                  <span className={`text-xs font-bold ${textMuted}`}>to</span>
                  <input
                    type="time"
                    className={`${fieldBase} w-33`}
                    value={period.endTime}
                    onChange={(e) => updatePeriod(period.id, { endTime: e.target.value })}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, schedule: f.schedule.filter((p) => p.id !== period.id) }))
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
            className="h-10 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-2 transition-colors hover:bg-[#6B0000]"
            style={{ background: "#8B0D0D" }}
          >
            <Save size={14} />
            {isEditing ? "Save Changes" : "Add Class"}
          </button>
        </div>
      </form>
    </section>
  );
}