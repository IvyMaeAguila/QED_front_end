import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft, Check, Pencil } from "lucide-react";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { RosterStudent } from "./data";
import type { AttendanceMap, GradeItem, GradingPeriod, HolisticMap, ScoreMap } from "./types/Grading";
import type { SubjectDetailTab } from "./components/TabNav";
import { AttendanceRecordsSection } from "./AttendanceRecordsPage";
import { AssessmentRecordsSection } from "./AssessmentRecordsPage";
import { HolisticRecordsSection } from "./HolisticRecordsPage";
import { fetchItems, fetchScores, saveScore } from "../services/subjectGrading.service";
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

  // Do NOT seed items/localScores from location.state. That stale snapshot
  // was causing the page to flash old (pre-edit) values immediately on
  // render, then visibly swap to the correct data once the fetch below
  // resolved — which looked like slowness/lag even though the fetch itself
  // was fine. Instead we start with nothing and show a loading state until
  // the first real fetch from the server completes, so the user only ever
  // sees correct data, never a stale flash.
  const [items, setItems] = useState<GradeItem[] | null>(null);
  const [localScores, setLocalScores] = useState<ScoreMap>({});
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const tab = state?.tab;
  const isAssessment = tab === "writtenWorks" || tab === "performanceTask" || tab === "exams";

  useEffect(() => {
    if (!subjectId || !isAssessment || !tab) return;

    let cancelled = false;
    setIsLoadingRecords(true);
    setLoadError(null);

    // IMPORTANT: do NOT filter by `tab` here. AssessmentRecordsSection
    // needs items from ALL THREE components (writtenWorks, performanceTask,
    // exams) in one array — it splits them into column groups itself.
    // Filtering server-side by the single tab this page was opened from
    // silently drops the other two groups' items, which is why Performance
    // Task / Exams appeared to go empty after an edit triggered a refetch.
    Promise.all([
      fetchItems(subjectId, { term: term || undefined }),
      fetchScores(subjectId),
    ])
      .then(([freshItems, freshScores]) => {
        if (cancelled) return;
        setItems(freshItems);
        setLocalScores(freshScores);
        setHasLoadedOnce(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load records:", err);
        setLoadError("Could not load the latest records. Showing last known data.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRecords(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subjectId, isAssessment, tab, term]);

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

    // Optimistic local update so typing feels instant.
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
      // If the save actually failed, resync from the server rather than
      // leaving the UI showing a value that never really persisted.
      setLoadError("Failed to save a score. Please retry.");
      fetchScores(subjectId)
        .then(setLocalScores)
        .catch(() => {
          /* best-effort resync; keep optimistic value if this also fails */
        });
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
            {loadError && <p className="mt-1 text-xs font-bold text-red-600">{loadError}</p>}
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

      {isAssessment && !hasLoadedOnce && isLoadingRecords && (
        <div className={`${cardClasses} px-5 py-16 text-center`}>
          <p className={`font-semibold ${textMuted}`}>Loading records…</p>
        </div>
      )}

      {isAssessment && hasLoadedOnce && (
        <AssessmentRecordsSection
          title={title}
          roster={roster}
          items={items ?? []}
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