import { useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Brain, Heart, Users2, Smile, ClipboardCheck, RotateCcw, Save, CheckCircle2, ArrowLeft } from "lucide-react";
import { useStudents } from "../../../admin/pages/studentrecords/context/StudentsContext";
import { formatFullName } from "../../../admin/pages/studentrecords/types/Students";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import {
  HOLISTIC_AXES,
  TERMS,
  emptyScores,
  emptyNotes,
  assessmentKey,
  type HolisticAssessment,
  type HolisticAxisKey,
  type Term,
} from "./types/Holistic";
import { AxisCard } from "./components/AxisCard";
import { HolisticRadarPreview } from "./components/HolisticRadarPreview";

const ACCENT = "#6B0000";

const AXIS_ICONS: Record<HolisticAxisKey, typeof Brain> = {
  cognitive: Brain,
  emotional: Heart,
  social: Users2,
  behavioral: Smile,
};


const AXIS_ACCENTS: Record<HolisticAxisKey, string> = {
  cognitive: "#6B0000",
  emotional: "#C2255C",
  social: "#1D70D6",
  behavioral: "#9C6B00",
};

interface TeacherHolisticAssessmentPageProps {
  teacherId?: string;
}

export function TeacherHolisticAssessmentPage({ teacherId = "current-teacher" }: TeacherHolisticAssessmentPageProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { studentId: routeStudentId } = useParams<{ studentId: string }>();
  const { students } = useStudents();

  const [selectedStudentId, setSelectedStudentId] = useState(routeStudentId ?? students[0]?.id ?? "");
  const [term, setTerm] = useState<Term>(1);

  // Local store standing in for a real backend — keyed by "studentId:term".
  // Swap for an API call (GET/POST holistic-assessments) when ready.
  const [savedAssessments, setSavedAssessments] = useState<Record<string, HolisticAssessment>>({});

  const [draftScores, setDraftScores] = useState<Record<HolisticAxisKey, number | null>>(emptyScores());
  const [draftNotes, setDraftNotes] = useState<Record<HolisticAxisKey, string>>(emptyNotes());
  const [savedFlash, setSavedFlash] = useState(false);

  const key = assessmentKey(selectedStudentId, term);
  const savedForCurrent = savedAssessments[key];
  const isDirty =
    !savedForCurrent ||
    JSON.stringify(savedForCurrent.scores) !== JSON.stringify(draftScores) ||
    JSON.stringify(savedForCurrent.notes) !== JSON.stringify(draftNotes);

  function loadStudentTerm(studentId: string, nextTerm: Term) {
    const existing = savedAssessments[assessmentKey(studentId, nextTerm)];
    setDraftScores(existing ? existing.scores : emptyScores());
    setDraftNotes(existing ? existing.notes : emptyNotes());
  }

  function handleSelectStudent(studentId: string) {
    setSelectedStudentId(studentId);
    loadStudentTerm(studentId, term);
  }

  function handleSelectTerm(nextTerm: Term) {
    setTerm(nextTerm);
    loadStudentTerm(selectedStudentId, nextTerm);
  }

  function handleReset() {
    if (savedForCurrent) {
      setDraftScores(savedForCurrent.scores);
      setDraftNotes(savedForCurrent.notes);
    } else {
      setDraftScores(emptyScores());
      setDraftNotes(emptyNotes());
    }
  }

  function handleSave() {
    const assessment: HolisticAssessment = {
      studentId: selectedStudentId,
      term,
      scores: draftScores,
      notes: draftNotes,
      assessedByTeacherId: teacherId,
      updatedAt: new Date().toISOString(),
    };
    setSavedAssessments((prev) => ({ ...prev, [key]: assessment }));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  const ratedCount = useMemo(
    () => HOLISTIC_AXES.filter((a) => draftScores[a.key] !== null).length,
    [draftScores]
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const cardClasses = `rounded-xl border shadow-sm overflow-hidden ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 ${textPrimary}`;
  const selectClasses = `h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#6B0000]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#6B0000]"
  }`;

  if (students.length === 0) {
    return (
      <div className={`${cardClasses} p-12 text-center`}>
        <p className={`text-sm font-semibold ${textMuted}`}>
          No students available to assess yet. Add students under Student Records first.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className={`h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-2 border transition-colors ${
            darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
          }`}
        >
          <ArrowLeft size={13} />
          Back to Roster
        </button>
      </div>

      <div>
        <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>Holistic Development Assessment</h1>
        <p className={`text-sm font-semibold mt-1 ${textMuted}`}>
          Rate each student across Cognitive, Emotional, Social, and Behavioral development.
        </p>
      </div>

      {/* Student + term selection */}
      <section className={`${cardClasses} p-5 flex flex-wrap items-end gap-4`}>
        <div className="flex-1 min-w-55">
          <label className={`block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`}>Student</label>
          <select value={selectedStudentId} onChange={(e) => handleSelectStudent(e.target.value)} className={`${selectClasses} w-full`}>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {formatFullName(s)} &middot; {s.gradeLevel} - {s.section}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`}>Term</label>
          <div className="flex gap-1.5">
            {TERMS.map((t) => {
              const active = t === term;
              return (
                <button
                  key={t}
                  onClick={() => handleSelectTerm(t)}
                  className={`h-10 px-4 rounded-xl text-sm font-bold border transition-colors ${
                    active
                      ? "text-white"
                      : darkMode
                      ? "border-[#374151] text-[#D1D5DB] hover:bg-white/5"
                      : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
                  }`}
                  style={active ? { background: ACCENT, borderColor: ACCENT } : undefined}
                >
                  Term {t}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Live radar preview */}
        <section className={`${cardClasses} p-5 flex flex-col items-center`}>
          <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${textMuted}`}>Live Preview</p>
          <HolisticRadarPreview scores={draftScores} darkMode={darkMode} />
          <p className={`mt-3 text-xs font-semibold ${textMuted}`}>{ratedCount} of 4 axes rated</p>
          {selectedStudent && (
            <p className={`mt-1 text-[11px] font-bold text-center ${textPrimary}`}>{formatFullName(selectedStudent)}</p>
          )}
        </section>

        {/* Axis rating cards */}
        <section className={cardClasses}>
          <div className={cardHeaderClasses}>
            <h2 className={sectionTitleClasses}>
              <ClipboardCheck size={15} style={{ color: ACCENT }} />
              Rate Development Axes
            </h2>
            {savedForCurrent && !isDirty && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 size={13} />
                Saved
              </span>
            )}
          </div>

          <div className="p-5 grid sm:grid-cols-2 gap-4">
            {HOLISTIC_AXES.map((axis) => (
              <AxisCard
                key={axis.key}
                icon={AXIS_ICONS[axis.key]}
                label={axis.label}
                description={axis.description}
                score={draftScores[axis.key]}
                note={draftNotes[axis.key]}
                onScoreChange={(value) => setDraftScores((prev) => ({ ...prev, [axis.key]: value }))}
                onNoteChange={(value) => setDraftNotes((prev) => ({ ...prev, [axis.key]: value }))}
                darkMode={darkMode}
                panelBorder={panelBorder}
                textPrimary={textPrimary}
                textMuted={textMuted}
                accent={AXIS_ACCENTS[axis.key]}
              />
            ))}
          </div>

          <div className={`px-5 py-4 border-t flex items-center justify-between gap-3 ${panelBorder}`}>
            <button
              onClick={handleReset}
              disabled={!isDirty}
              className={`h-10 px-4 rounded-xl text-xs font-bold border inline-flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
              }`}
            >
              <RotateCcw size={13} />
              Reset
            </button>

            <button
              onClick={handleSave}
              disabled={ratedCount === 0}
              className="h-10 px-5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: ACCENT }}
            >
              {savedFlash ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {savedFlash ? "Saved" : "Save Assessment"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}