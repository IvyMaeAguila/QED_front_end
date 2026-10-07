import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Loader2,
  Pencil,
} from "lucide-react";
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
  getEffectiveWeightsSafe,
  type EffectiveWeights,
} from "../services/subjectGradeTemplate.service";
import { ConfirmationModal } from "@shared/components/ConfirmationModal";

const ACCENT = "#6B0000";

type GenderedStudent = RosterStudent & { gender?: "M" | "F" };

interface MissingScoreEntry {
  studentId: string;
  studentName: string;
  itemName: string;
}

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

  // Resolved server-side by getEffectiveWeights: an active uploaded
  // template takes precedence, falling back to the admin's manually
  // entered subject_weight_distribution rows, falling back to undefined
  // (nothing configured at all) if neither exists. AssessmentRecordsSection
  // only gets examSubWeights when an active template supplied them — a
  // manual-only or fully-default subject falls back to pooled exam
  // grading, same as before.
  const [effectiveWeights, setEffectiveWeights] = useState<EffectiveWeights | undefined>(undefined);
  const [weightsError, setWeightsError] = useState<string | null>(null);

  // Empty-score confirmation, shown when the teacher tries to exit edit
  // mode ("Done") while some students still have blank scores. Saving an
  // empty score already works (handleScoreChange happily persists null) —
  // this is purely a "are you sure?" checkpoint, since a blank score is
  // what flags a missing activity to parents.
  const [showEmptyScoreModal, setShowEmptyScoreModal] = useState(false);
  const [pendingMissing, setPendingMissing] = useState<MissingScoreEntry[]>(
    [],
  );

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
      // subjectId here is a subject-section id (confirmed against the
      // schema: `subject-section`.id, distinct from elem_subjects.id).
      // getEffectiveWeightsSafe resolves the subject_id join server-side,
      // so passing the section id directly here is correct.
      getEffectiveWeightsSafe(Number(subjectId), term || undefined),
    ])
      .then(([freshItems, freshScores, weights]) => {
        if (cancelled) return;
        setItems(freshItems);
        setLocalScores(freshScores);
        setEffectiveWeights(weights);
        setWeightsError(weights ? null : "No grading rules are configured for this subject. Ask an admin to upload the approved grade template before recording grades.");
        setHasLoadedOnce(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load records:", err);
        setLoadError(
          "Could not load the latest records. Showing last known data.",
        );
        setWeightsError("Could not load this subject's grading rules. Grade calculations are unavailable until the rules load successfully.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRecords(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subjectId, isAssessment, tab, term]);

  const weights = useMemo(() => {
    if (effectiveWeights) {
      return {
        ww: effectiveWeights.ww,
        pt: effectiveWeights.pt,
        exam: effectiveWeights.exam,
        examSubWeights: effectiveWeights.examSubWeights,
        examinations: effectiveWeights.examinations,
        templateStructure: effectiveWeights.templateStructure,
      };
    }
    // Nothing configured for this subject at all (no template, no
    // subject_weight_distribution rows) — last-resort default matching
    // DepEd Order No. 015, s. 2026's general split for most learning
    // areas. MAPEH/EPP use 20/60/20 under that order instead; this
    // fallback can't distinguish subject category, so it's only correct
    // for subjects that haven't been configured yet. The real fix is
    // seeding subject_weight_distribution for every subject so this
    // branch stops being reached in practice.
    return null;
  }, [effectiveWeights]);

  const selectedTermNumber = useMemo(() => {
    if (!state) return undefined;
    return state.terms.find((t) => t.id === term)?.termNumber;
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

  // Finds every (student, item) pair in the current record that has no
  // score yet. Used to warn the teacher before they leave edit mode.
  function findMissingScores(): MissingScoreEntry[] {
    if (!items || items.length === 0 || !state) return [];
    const missing: MissingScoreEntry[] = [];
    for (const student of state.roster) {
      for (const item of items) {
        const value = localScores[student.id]?.[item.id];
        if (value === undefined || value === null) {
          missing.push({
            studentId: student.id,
            studentName: student.name,
            itemName:
              (item as GradeItem & { activityName?: string }).activityName ??
              item.topic ??
              "Untitled item",
          });
        }
      }
    }
    return missing;
  }

  function handleDoneClick() {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    const missing = findMissingScores();
    if (missing.length > 0) {
      setPendingMissing(missing);
      setShowEmptyScoreModal(true);
      return;
    }
    setIsEditing(false);
  }

  function confirmSaveWithEmptyScores() {
    // Scores are already persisted as they were typed (handleScoreChange
    // saves on every change, including clearing a field to null). This
    // just confirms the teacher meant to leave those fields blank.
    setShowEmptyScoreModal(false);
    setPendingMissing([]);
    setIsEditing(false);
  }

  function cancelEmptyScoreModal() {
    setShowEmptyScoreModal(false);
    setPendingMissing([]);
    // Stay in edit mode so the teacher can fill in the missing scores.
  }

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const backButton = (
    <button
      onClick={() => navigate(-1)}
      aria-label="Go back"
      className={`system-back-button flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${panelBg} ${panelBorder} ${textMuted} ${
        darkMode ? "hover:bg-white/10 hover:text-white" : "hover:bg-black/5 hover:text-black"
      }`}
    >
      <ArrowLeft size={18} />
    </button>
  );

  if (!state) {
    return (
      <div className="w-full min-h-full pb-12">
        <div className="w-full space-y-6">
          <div className="flex items-start gap-2.5">
            {backButton}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-maroon">
              <ClipboardList size={28} />
            </span>
            <div>
              <h1 className={`qed-type-page-title ${textPrimary}`}>
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

  // Cap the list shown in the modal so it never becomes an unwieldy wall
  // of names when many scores are missing.
  const MODAL_LIST_LIMIT = 6;
  const uniqueMissingStudents = Array.from(
    new Map(pendingMissing.map((m) => [m.studentId, m.studentName])).values(),
  );

  return (
    <div className="w-full min-h-full pb-0">
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            {backButton}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-maroon">
              <ClipboardList size={28} />
            </span>
            <div>
              <h1 className={`qed-type-page-title ${textPrimary}`}>
                {subjectName} — {title}
              </h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
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
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-extrabold"
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
                  className={`h-8 rounded-lg border px-2.5 text-xs font-bold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}
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
                  onClick={handleDoneClick}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-extrabold transition-colors ${
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

        {isAssessment && weightsError && hasLoadedOnce && (
          <div className={`${cardClasses} border-amber-500/40 px-5 py-4 text-sm font-semibold text-amber-700`} role="alert">
            {weightsError}
          </div>
        )}

        {isAssessment && hasLoadedOnce && subjectId && weights && (
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
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />
        )}
      </div>

      {showEmptyScoreModal && (
        <ConfirmationModal
          title="Save with missing scores?"
          description={
            <>
                  {uniqueMissingStudents.length} student
                  {uniqueMissingStudents.length === 1 ? "" : "s"} still
                  {uniqueMissingStudents.length === 1 ? " has" : " have"}{" "}
                  blank score{pendingMissing.length === 1 ? "" : "s"} in this
                  record. Leaving them blank will flag the activity as
                  missing to parents.
            </>
          }
          onClose={cancelEmptyScoreModal}
          onConfirm={confirmSaveWithEmptyScores}
          confirmLabel="Save Anyway"
          cancelLabel="Keep Editing"
          variant="warning"
          size="narrow"
          darkMode={darkMode}
          panelClassName={`shadow-2xl ${panelBg} ${panelBorder}`}
          titleClassName={textPrimary}
          descriptionClassName={textMuted}
          bodyClassName="px-5 pb-4 pt-0"
          footerClassName="px-5 py-4"
          cancelButtonClassName={`${panelBorder} ${textPrimary} hover:bg-black/5`}
          confirmButtonClassName="border border-black/10 bg-[#800000] hover:bg-[#650000]"
        >
              <ul
                className={`max-h-40 space-y-1 overflow-y-auto rounded-lg border px-3 py-2 text-xs font-semibold ${panelBorder} ${textPrimary}`}
              >
                {uniqueMissingStudents.slice(0, MODAL_LIST_LIMIT).map((name) => (
                  <li key={name}>{name}</li>
                ))}
                {uniqueMissingStudents.length > MODAL_LIST_LIMIT && (
                  <li className={textMuted}>
                    +{uniqueMissingStudents.length - MODAL_LIST_LIMIT} more
                  </li>
                )}
              </ul>
        </ConfirmationModal>
      )}
    </div>
  );
}
