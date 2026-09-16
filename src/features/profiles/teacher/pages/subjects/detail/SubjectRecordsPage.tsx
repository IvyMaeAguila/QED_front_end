import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { ArrowLeft, Check, ClipboardList, Loader2, Pencil } from "lucide-react";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { RosterStudent } from "./data";
import type {
  GradeItem,
  GradingPeriod,
  HolisticMap,
  ScoreMap,
} from "./types/Grading";
import type { SubjectDetailTab } from "./components/TabNav";
import { AssessmentRecordsSection } from "./AssessmentRecordsPage";
import { HolisticRecordsSection } from "./HolisticRecordsPage";
import {
  fetchItems,
  fetchScores,
  saveScore,
} from "../services/subjectGrading.service";
import {
  getComponentWeights,
  inferSubjectCategory,
  type SubjectCategory,
} from "./utils/GradeWeights";

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
  holistic: HolisticMap;
  terms: GradingPeriod[];
  selectedTerm: string;
  isOwnAdvisory?: boolean;
  adviserName?: string;
}

const RECORDS_TITLES: Record<SubjectDetailTab, string> = {
  holistic: "Holistic Assessment Records",
  writtenWorks: "Class Record",
  performanceTask: "Class Record",
  exams: "Class Record",
} as Record<SubjectDetailTab, string>;

export function SubjectRecordsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
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
  const isAssessment =
    tab === "writtenWorks" || tab === "performanceTask" || tab === "exams";

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
        setLoadError(
          "Could not load the latest records. Showing last known data.",
        );
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
    const category: SubjectCategory =
      (state.subjectCategory as SubjectCategory) ||
      inferSubjectCategory(state.subjectName);
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

  function handleScoreChange(
    studentId: string,
    itemId: string,
    maxItems: number,
    rawValue: string,
  ) {
    const trimmed = rawValue.trim();
    const value = trimmed === "" ? null : Number(trimmed);
    if (
      value !== null &&
      (Number.isNaN(value) || value < 0 || value > maxItems)
    )
      return;

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

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
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
      <div className="w-full min-h-full pb-12">
        <div className="w-full px-6 lg:px-8 pt-6 space-y-4">
          <div className="flex items-start gap-2.5">
            {backButton}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-maroon">
              <ClipboardList size={28} />
            </span>
            <div>
              <h1 className={`text-lg font-black tracking-tight ${textPrimary}`}>
                Records
              </h1>
            </div>
          </div>
          <div className={`${cardClasses} px-5 py-14 text-center`}>
            <p className={`text-sm font-bold ${textPrimary}`}>No records data</p>
            <p className={`mt-1 text-xs ${textMuted}`}>
              Open this page from a subject tab to view its records.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { subjectName, roster, terms } = state;
  const title = RECORDS_TITLES[tab as SubjectDetailTab];
  const subtitle =
    tab === "holistic"
      ? "Read-only history — enter this week's ratings from the Holistic tab."
      : isEditing
        ? "Edit mode — changes save immediately. Click Done when finished."
        : "A complete record for all enrolled students.";

  return (
    <div className="w-full min-h-full pb-0">
      <div className="w-full px-6 lg:px-8 pt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            {backButton}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-maroon">
              <ClipboardList size={28} />
            </span>
            <div>
              <h1 className={`text-lg font-black tracking-tight ${textPrimary}`}>
                {subjectName} — {title}
              </h1>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                {subtitle}
              </p>
              {loadError && (
                <p className="mt-1 text-xs font-semibold text-red-500">
                  {loadError}
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          className={`flex flex-wrap items-center justify-between gap-2.5 rounded-xl border px-3 py-2 ${panelBg} ${panelBorder}`}
        >
          <span
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-extrabold"
            style={{ backgroundColor: "#F8EDEE", color: ACCENT }}
          >
            {roster.length} student{roster.length === 1 ? "" : "s"}
          </span>

          {(terms.length > 0 || isAssessment) && (
            <div className="flex items-center gap-2.5">
              {terms.length > 0 && (
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className={`h-8 rounded-lg border px-2.5 text-[11px] font-bold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}
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
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-extrabold transition-colors ${
                    isEditing
                      ? "border-black/10 bg-[#800000] text-white hover:bg-[#650000]"
                      : darkMode
                        ? "border-white/10 text-white/80 hover:bg-white/5"
                        : "border-black/10 text-[#111827] hover:bg-black/5"
                  }`}
                >
                  {isEditing ? <Check size={12} /> : <Pencil size={12} />}
                  {isEditing ? "Done" : "Edit Records"}
                </button>
              )}
            </div>
          )}
        </div>

        {isAssessment && !hasLoadedOnce && isLoadingRecords && (
          <div className={`${cardClasses} flex items-center justify-center gap-2 px-5 py-14`}>
            <Loader2 size={15} className={`animate-spin ${textMuted}`} />
            <p className={`text-xs font-semibold ${textMuted}`}>
              Loading records…
            </p>
          </div>
        )}

        {isAssessment && hasLoadedOnce && subjectId && (
          <AssessmentRecordsSection
            subjectSectionId={subjectId}
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
            isOwnAdvisory={state.isOwnAdvisory}
            adviserName={state.adviserName}
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
    </div>
  );
}