import { useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft, Check, Pencil } from "lucide-react";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { RosterStudent } from "./data";
import type { AttendanceMap, GradeItem, GradingPeriod, HolisticMap, ScoreMap } from "./types/Grading";
import type { SubjectDetailTab } from "./components/TabNav";
import { AttendanceRecordsSection } from "./AttendanceRecordsPage";
import { AssessmentRecordsSection } from "./AssessmentRecordsPage";
import { HolisticRecordsSection } from "./HolisticRecordsPage";
import { saveScore } from "../services/subjectGrading.service";
import { getComponentWeights, inferSubjectCategory, type SubjectCategory } from "./utils/GradeWeights";

const ACCENT = "#6B0000";

type GenderedStudent = RosterStudent & { gender?: "M" | "F" };

interface RecordsLocationState {
  subjectName: string;
  subjectCategory: string | null;
  gradeLevel: string;
  tab: SubjectDetailTab;
  roster: GenderedStudent[];
  items: GradeItem[];
  scores: ScoreMap;
  attendance: AttendanceMap;
  holistic: HolisticMap;
  terms: GradingPeriod[];
  selectedTerm: string;
}

const RECORDS_TITLES: Record<SubjectDetailTab, string> = {
  attendance: "Attendance Records",
  holistic: "Holistic Assessment Records",
  writtenWorks: "Class Record",
  performanceTask: "Class Record",
  exams: "Class Record",
} as Record<SubjectDetailTab, string>;

export function SubjectRecordsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectId } = useParams<{ subjectId: string }>();
  const state = location.state as RecordsLocationState | undefined;

  const [term, setTerm] = useState(state?.selectedTerm ?? "");

  const [isEditing, setIsEditing] = useState(false);
  const [localScores, setLocalScores] = useState<ScoreMap>(() => state?.scores ?? {});

  const tab = state?.tab;
  const isAssessment = tab === "writtenWorks" || tab === "performanceTask" || tab === "exams";

  const weights = useMemo(() => {
    if (!state) return { ww: 30, pt: 50, exam: 20 };
    const category: SubjectCategory = (state.subjectCategory as SubjectCategory) || inferSubjectCategory(state.subjectName);
    return getComponentWeights(state.gradeLevel, category);
  }, [state]);


  const selectedTermNumber = useMemo(() => {
    if (!state) return undefined;
    return state.terms.find((t) => t.id === term)?.termNumber;
  }, [state, term]);


  const selectedTermStartDate = useMemo(() => {
    if (!state) return undefined;
    return state.terms.find((t) => t.id === term)?.startDate;
  }, [state, term]);

  function handleScoreChange(studentId: string, itemId: string, maxItems: number, rawValue: string) {
    const trimmed = rawValue.trim();
    const value = trimmed === "" ? null : Number(trimmed);
    if (value !== null && (Number.isNaN(value) || value < 0 || value > maxItems)) return;

    setLocalScores((prev) => {
      const studentScores = { ...(prev[studentId] ?? {}) };
      if (value === null) {
        delete studentScores[itemId];
      } else {
        studentScores[itemId] = value;
      }
      return { ...prev, [studentId]: studentScores };
    });

    if (!subjectId) return;
    saveScore(subjectId, studentId, itemId, value).catch((err) => {
      console.error("Failed to save score:", err);
    });
  }

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;
  const backButton = (
    <button
      onClick={() => navigate(-1)}
      aria-label="Go back"
      className={`mt-1 shrink-0 ${textMuted} hover:${textPrimary}`}
    >
      <ArrowLeft size={22} />
    </button>
  );

  if (!state) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-start gap-3">
          {backButton}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
              Subject Records
            </p>
            <h1 className={`mt-1 text-3xl font-black ${textPrimary}`}>Records</h1>
          </div>
        </div>
        <div className={`${cardClasses} px-5 py-16 text-center`}>
          <p className={`font-bold ${textPrimary}`}>No records data</p>
          <p className={`mt-1 text-sm ${textMuted}`}>Open this page from a subject tab to view its records.</p>
        </div>
      </div>
    );
  }

  const { subjectName, roster, terms } = state;
  const title = RECORDS_TITLES[tab as SubjectDetailTab];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-3">
          {backButton}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
              {subjectName}
            </p>
            <h1 className={`mt-1 text-3xl font-black tracking-tight ${textPrimary}`}>{title}</h1>
            <p className={`mt-1 text-sm font-medium ${textMuted}`}>
              {tab === "attendance"
                ? "Click a cell to edit — changes save immediately."
                : tab === "holistic"
                  ? "Read-only history. Enter this week's ratings from the Holistic tab."
                  : isEditing
                    ? "Edit mode — changes save immediately. Click Done when finished."
                    : "A complete record for all enrolled students."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tab !== "attendance" && terms.length > 0 && (
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className={`h-10 rounded-xl border px-2.5 text-xs font-bold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}
              aria-label="Term"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
          {isAssessment && (
            <button
              onClick={() => setIsEditing((v) => !v)}
              className={`flex h-10 items-center gap-1.5 rounded-xl px-4 text-xs font-extrabold transition-colors ${
                isEditing
                  ? "text-white"
                  : darkMode
                    ? "border border-white/10 text-white/80 hover:bg-white/5"
                    : "border border-black/10 text-[#111827] hover:bg-black/5"
              }`}
              style={isEditing ? { background: ACCENT } : undefined}
            >
              {isEditing ? <Check size={14} /> : <Pencil size={14} />}
              {isEditing ? "Done" : "Edit Records"}
            </button>
          )}
          <span className="w-fit rounded-xl px-3 py-2 text-xs font-extrabold" style={{ backgroundColor: "#F8EDEE", color: ACCENT }}>
            {roster.length} student{roster.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {tab === "attendance" && subjectId && (
        <AttendanceRecordsSection
          subjectSectionId={subjectId}
          roster={roster}
          terms={terms}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      )}

      {isAssessment && (
        <AssessmentRecordsSection
          title={title}
          roster={roster}
          items={state.items}
          scores={localScores}
          weights={weights}
          term={term}
          isEditing={isEditing}
          onScoreChange={handleScoreChange}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      )}

      {tab === "holistic" && subjectId && (
        <HolisticRecordsSection
          subjectSectionId={subjectId}
          roster={roster}
          termNumber={selectedTermNumber}
          termStartDate={selectedTermStartDate}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      )}
    </div>
  );
}