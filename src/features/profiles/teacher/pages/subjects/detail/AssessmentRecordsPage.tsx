import { Fragment, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Send, X } from "lucide-react";
import type { RosterStudent } from "./data";
import {
  formatShortDate,
  type ExamType,
  type GradeItem,
  type ScoreMap,
} from "./types/Grading";
import { computeInitialGrade, computePS, computeWS } from "./utils/GradeWeights";
import { submitGrades } from "../services/subjectGrading.service";

const ACCENT = "#6B0000";
const INCOMPLETE_COLOR = "#CA8A04"; // amber — signals "not finished yet", distinct from a real score

// Small badge shown in place of a number whenever a component isn't fully
// scored yet. Kept visually distinct (amber pill, "INC") so it reads as an
// intentional status rather than a blank/error — and can never be mistaken
// for an actual grade like a stray "100" would be.
function IncompleteBadge() {
  return (
    <span
      title="Incomplete — not all items have been scored yet"
      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-black tracking-wide"
      style={{ backgroundColor: "#FEF3C7", color: INCOMPLETE_COLOR }}
    >
      INC
    </span>
  );
}

type GenderedStudent = RosterStudent & { gender?: "M" | "F" };

interface ComponentColumnGroup {
  key: "writtenWorks" | "performanceTask" | "exams";
  label: string;
  weightLabel: string;
  weight: number;
  items: GradeItem[];
}

interface AssessmentRecordsSectionProps {
  // Needed to actually submit grades against the right subject/section.
  subjectSectionId: string;
  title: string;
  roster: GenderedStudent[];
  items: GradeItem[];
  scores: ScoreMap;
  weights: { ww: number; pt: number; exam: number };
  term: string;
  // Editing and term selection are owned entirely by the parent page
  // (SubjectRecordsPage), which already renders the term <select> and the
  // "Edit Records" / "Done" toggle in its own header. This section used to
  // render a SECOND term dropdown and a SECOND edit toggle here, both
  // wired to optional no-op callbacks — two controls doing the same job,
  // visible in two places at once, and one of them didn't even do
  // anything. Removed. This section now only consumes `isEditing`/`term`
  // to decide how to render, it doesn't offer its own way to change them.
  isEditing: boolean;
  onScoreChange: (studentId: string, itemId: string, maxItems: number, rawValue: string) => void;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  // NEW: when this subject *is* the teacher's own advisory class, there is
  // no separate adviser to send grades to — the teacher IS the adviser —
  // so the "Submit Grades" control has nothing meaningful to do and is
  // hidden entirely. When false (subject taught to a class the teacher is
  // NOT the adviser of), grades get sent to that class's adviser, so the
  // submit + confirmation flow renders as normal.
  isOwnAdvisory?: boolean;
  // Optional display name of the receiving adviser, used only in the
  // confirmation copy ("send to <adviserName>'s gradesheet"). Falls back
  // to a generic phrase if not provided.
  adviserName?: string;
}

// -----------------------------------------------------------------------
// GRADING LOGIC — read this before touching anything below.
//
// Previously, `highestPossible` was built ONLY from the items that already
// had a score entered ("scored"). That meant if a group had 3 quizzes and
// a student only had 1 scored, highestPossible became just that 1 quiz's
// max — not the full 3-quiz requirement. If that single entered score was
// a perfect one, total / highestPossible worked out to 100%, even though
// 2 quizzes were still completely empty. The denominator was silently
// shrinking to match whatever happened to be filled in.
//
// Fixed logic:
//   - `highestPossible` is ALWAYS the sum of maxItems across every item
//     in the group (the full requirement), regardless of how many are
//     actually scored yet.
//   - A missing score is NOT treated as a 0 (that would unfairly punish
//     a student before a teacher has graded the item), and it is NOT
//     silently excluded from the denominator either (that's the bug).
//   - A percentage/weighted score is only computed once EVERY item in
//     the group has an actual recorded score. Until then, the row is
//     explicitly "Incomplete" — never a number, and never 100% by
//     accident.
// -----------------------------------------------------------------------
interface StudentGroupTotals {
  total: number;          // sum of entered scores only
  highestPossible: number; // full possible points across ALL items in the group
  scoredCount: number;     // how many items actually have a score
  totalItems: number;      // how many items exist in this group
  isComplete: boolean;     // true only when every item has been scored
}

function studentTotals(items: GradeItem[], studentId: string, scores: ScoreMap): StudentGroupTotals {
  const highestPossible = items.reduce((sum, item) => sum + item.maxItems, 0);

  let total = 0;
  let scoredCount = 0;
  for (const item of items) {
    const value = scores[studentId]?.[item.id];
    if (typeof value === "number") {
      total += value;
      scoredCount += 1;
    }
  }

  return {
    total,
    highestPossible,
    scoredCount,
    totalItems: items.length,
    isComplete: items.length > 0 && scoredCount === items.length,
  };
}

function columnLabel(item: GradeItem, groupKey: ComponentColumnGroup["key"]) {
  return groupKey === "exams" ? (item.examType as ExamType) : formatShortDate(item.date);
}

// Shared by both the on-screen row and the pre-submit confirmation preview
// so the two never drift apart — same weighted scores in, same Initial
// Grade out, everywhere it's shown.
function computeStudentGrade(
  student: GenderedStudent,
  groups: ComponentColumnGroup[],
  scores: ScoreMap,
): { initialGrade: number | null; anyGroupIncomplete: boolean } {
  const weightedScores: number[] = [];
  let anyGroupIncomplete = false;

  groups.forEach((group) => {
    const { total, highestPossible, totalItems, isComplete } = studentTotals(group.items, student.id, scores);
    const ps = computePS(total, highestPossible);
    const ws = computeWS(ps, group.weight);
    if (totalItems > 0 && !isComplete) anyGroupIncomplete = true;
    if (ws !== null) weightedScores.push(ws);
  });

  const initialGrade = computeInitialGrade(
    weightedScores[0] ?? null,
    weightedScores[1] ?? null,
    weightedScores[2] ?? null,
  );

  return { initialGrade, anyGroupIncomplete };
}

// DepEd-style descriptor bands for the rounded Term (Quarterly) Grade.
function getRemarksAndDescription(termGrade: number): { remarks: "PASSED" | "FAILED"; description: string } {
  if (termGrade >= 90) return { remarks: "PASSED", description: "Advancing" };
  if (termGrade >= 80) return { remarks: "PASSED", description: "Benchmarking" };
  if (termGrade >= 75) return { remarks: "PASSED", description: "Connecting" };
  if (termGrade >= 65) return { remarks: "FAILED", description: "Developing" };
  return { remarks: "FAILED", description: "Emerging" };
}

interface StudentGradePreview {
  id: string;
  name: string;
  previewGrade: number; // Initial Grade, 2 decimals — matches the "Initial Grade" column
  termGrade: number;    // rounded whole number — what actually posts to the adviser's sheet
  remarks: "PASSED" | "FAILED";
  description: string;
}

export function AssessmentRecordsSection({
  subjectSectionId,
  title,
  roster,
  items,
  scores,
  weights,
  term,
  isEditing,
  onScoreChange,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  isOwnAdvisory = false,
  adviserName,
}: AssessmentRecordsSectionProps) {
  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;
  const cellInputClasses = `w-14 rounded-md border px-1 py-0.5 text-center text-xs font-bold outline-none ${panelBorder} ${
    darkMode ? "bg-[#0B1120] text-white" : "bg-white text-[#111827]"
  }`;

  const groups: ComponentColumnGroup[] = useMemo(() => {
    const forTerm = (t: GradeItem["tab"]) =>
      items.filter((i) => i.tab === t && (!term || i.gradingPeriodId === term)).sort((a, b) => a.date.localeCompare(b.date));
    return [
      { key: "writtenWorks", label: "Written / Oral Works", weightLabel: `${weights.ww}%`, weight: weights.ww, items: forTerm("writtenWorks") },
      { key: "performanceTask", label: "Product / Performance Tasks", weightLabel: `${weights.pt}%`, weight: weights.pt, items: forTerm("performanceTask") },
      { key: "exams", label: "Summative Tests and Term Examinations", weightLabel: `${weights.exam}%`, weight: weights.exam, items: forTerm("exams") },
    ];
  }, [items, term, weights]);

  const grouped = useMemo(() => {
    const male = roster.filter((s) => s.gender !== "F");
    const female = roster.filter((s) => s.gender === "F");
    return { male, female };
  }, [roster]);

  // Grades can only be submitted once every group that actually has items
  // is fully scored for every enrolled student — otherwise we'd be
  // submitting Initial Grades that are silently based on 0s for ungraded
  // work.
  const isFullyGraded = useMemo(() => {
    if (roster.length === 0) return false;
    return roster.every((student) =>
      groups.every((group) => {
        if (group.items.length === 0) return true;
        return studentTotals(group.items, student.id, scores).isComplete;
      }),
    );
  }, [roster, groups, scores]);

  // Builds the specific, human-readable list of what's still missing, so
  // the snackbar can say more than just "incomplete" — e.g. call out that
  // the Summative Tests/Exams column specifically isn't done yet, which is
  // the single most common reason submission gets blocked.
  const incompleteReasons = useMemo(() => {
    const reasons: string[] = [];
    groups.forEach((group) => {
      if (group.items.length === 0) return;
      const anyMissing = roster.some((student) => !studentTotals(group.items, student.id, scores).isComplete);
      if (anyMissing) reasons.push(group.label);
    });
    return reasons;
  }, [groups, roster, scores]);

  // Per-student figures shown in the confirmation modal right before the
  // actual submit call fires — the teacher gets one last look at exactly
  // what will land on the adviser's gradesheet.
  const gradePreviews: StudentGradePreview[] = useMemo(() => {
    return roster.map((student) => {
      const { initialGrade } = computeStudentGrade(student, groups, scores);
      const previewGrade = initialGrade ?? 0;
      const termGrade = Math.round(previewGrade);
      const { remarks, description } = getRemarksAndDescription(termGrade);
      return { id: student.id, name: student.name, previewGrade, termGrade, remarks, description };
    });
  }, [roster, groups, scores]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [snackbar, setSnackbar] = useState<{ type: "error" | "success"; message: string } | null>(null);

  // Auto-dismiss the snackbar so it doesn't linger indefinitely.
  useEffect(() => {
    if (!snackbar) return;
    const timeout = window.setTimeout(() => setSnackbar(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [snackbar]);

  // Clicking "Submit Grades" no longer just no-ops behind a disabled
  // state — it actively validates and tells the teacher *why* it can't
  // proceed yet (snackbar), or opens the confirmation preview when it can.
  function handleSubmitClick() {
    if (isSubmitting) return;
    if (!isFullyGraded) {
      const detail =
        incompleteReasons.length > 0
          ? `Missing scores in: ${incompleteReasons.join(", ")}.`
          : "Some students still have ungraded items.";
      setSnackbar({
        type: "error",
        message: `Cannot submit — all grades must be complete first. ${detail}`,
      });
      return;
    }
    setSubmitError(null);
    setShowConfirmModal(true);
  }

  async function handleConfirmSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitGrades(subjectSectionId, term);
      setShowConfirmModal(false);
      setJustSubmitted(true);
      setSnackbar({ type: "success", message: "Grades submitted to the adviser's gradesheet." });
      window.setTimeout(() => setJustSubmitted(false), 3000);
    } catch (err) {
      console.error("Failed to submit grades:", err);
      setSubmitError("Failed to submit grades. Please try again.");
      setSnackbar({ type: "error", message: "Failed to submit grades. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const columnCount = 1 + groups.reduce((sum, g) => sum + g.items.length + 3, 0) + 1;

  function renderStudentRow(student: GenderedStudent, index: number) {
    const weightedScores: number[] = [];
    let anyGroupIncomplete = false;

    const groupCells = groups.map((group) => {
      const { total, highestPossible, scoredCount, totalItems, isComplete } = studentTotals(
        group.items,
        student.id,
        scores,
      );

      // Always compute PS/WS from the full total vs. the full possible
      // score — missing items contribute 0 to the numerator but still
      // count fully in the denominator (highestPossible), so an empty
      // item behaves exactly like a zero rather than being skipped or
      // blocking the calculation. The INC badge is purely a visual flag
      // that some items are still ungraded — it does not change the math.
      const ps = computePS(total, highestPossible);
      const ws = computeWS(ps, group.weight);

      if (totalItems > 0 && !isComplete) anyGroupIncomplete = true;
      if (ws !== null) weightedScores.push(ws);

      const hasAnyItems = totalItems > 0;

      return (
        <Fragment key={group.key}>
          {group.items.map((item) => (
            <td key={item.id} className="px-2 py-2.5 text-center text-xs font-bold tabular-nums">
              {isEditing ? (
                <input
                  type="number"
                  min={0}
                  max={item.maxItems}
                  step="1"
                  inputMode="numeric"
                  value={scores[student.id]?.[item.id] ?? ""}
                  onChange={(e) => onScoreChange(student.id, item.id, item.maxItems, e.target.value)}
                  className={cellInputClasses}
                />
              ) : (
                scores[student.id]?.[item.id] ?? "—"
              )}
            </td>
          ))}
          <td
            className="px-2 py-2.5 text-center text-xs font-black tabular-nums"
            style={{ color: hasAnyItems && !isComplete ? INCOMPLETE_COLOR : ACCENT }}
            title={hasAnyItems && !isComplete ? `${scoredCount}/${totalItems} items scored so far` : undefined}
          >
            {!hasAnyItems ? "—" : total}
            {hasAnyItems && !isComplete && (
              <span className="ml-1 text-[10px] font-bold opacity-80">
                ({scoredCount}/{totalItems})
              </span>
            )}
          </td>
          <td className="px-2 py-2.5 text-center text-xs font-bold tabular-nums">
            <span className="inline-flex items-center gap-1">
              {ps !== null ? ps.toFixed(2) : "—"}
              {hasAnyItems && !isComplete && <IncompleteBadge />}
            </span>
          </td>
          <td className="px-2 py-2.5 text-center text-xs font-bold tabular-nums">
            <span className="inline-flex items-center gap-1">
              {ws !== null ? ws.toFixed(2) : "—"}
              {hasAnyItems && !isComplete && <IncompleteBadge />}
            </span>
          </td>
        </Fragment>
      );
    });

    // If any component that actually has items is still incomplete, we
    // still compute the Initial Grade from the (0-filled) weighted scores
    // so a running/preview grade is always visible — but we flag it with
    // the INC badge so it's never mistaken for a final, settled grade.
    const initialGrade = computeInitialGrade(
      weightedScores[0] ?? null,
      weightedScores[1] ?? null,
      weightedScores[2] ?? null,
    );

    return (
      <tr key={student.id} className={`border-t ${panelBorder} ${index % 2 ? (darkMode ? "bg-white/1.5" : "bg-black/[0.012]") : ""}`}>
        <td className={`sticky left-0 z-10 px-4 py-2.5 text-sm font-bold ${darkMode ? "bg-[#111827]" : "bg-white"} ${textPrimary}`}>
          {student.name}
        </td>
        {groupCells}
        <td className="px-3 py-2.5 text-center text-sm font-black tabular-nums">
          <span className="inline-flex items-center gap-1" style={{ color: ACCENT }}>
            {initialGrade !== null ? initialGrade : "—"}
            {anyGroupIncomplete && <IncompleteBadge />}
          </span>
        </td>
      </tr>
    );
  }

  return (
    <section className={cardClasses} aria-label={title}>
      {/* Header: title on its own line, then a single control row. Term
          selection and edit mode live only in the parent page's header now
          — this row just reflects context (student count) and, when this
          subject isn't the teacher's own advisory class, offers the one
          action that's actually this section's own: submitting the grades
          computed from the table below to that class's adviser. */}
      <div className={`border-b ${panelBorder} ${darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {justSubmitted && (
              <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "#16A34A" }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Grades submitted
              </span>
            )}
          </div>

          {/* Own-advisory subjects have no separate adviser to send to, so
              the submit control simply isn't rendered here. */}
          {!isOwnAdvisory && (
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={isSubmitting}
              title={isSubmitting ? "Submitting…" : "Submit Grades"}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-maroon-gradient px-4 text-xs font-bold uppercase tracking-wide text-white shadow-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? "Submitting…" : "Submit Grades"}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-xs border-collapse">
          <thead>
            {/* Row 1: category headers, spanning each group's dynamic column count */}
            <tr className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
              <th
                rowSpan={3}
                className={`sticky left-0 z-10 min-w-52 border px-3 py-3 text-left text-sm font-black uppercase ${darkMode ? "bg-[#111827]" : "bg-white"} ${panelBorder} ${textPrimary}`}
              >
                Learners' Names
              </th>
              {groups.map((group) => (
                <th
                  key={group.key}
                  colSpan={group.items.length + 3}
                  className={`border px-2 py-3 text-center text-xs font-black uppercase ${panelBorder} ${textPrimary}`}
                >
                  {group.label} ({group.weightLabel})
                </th>
              ))}
              <th rowSpan={3} className={`border px-3 py-3 text-center text-xs font-black uppercase ${panelBorder} ${textPrimary}`}>
                Initial
                <br />
                Grade
              </th>
            </tr>
            {/* Row 2: per-item date/type columns + Total/PS/WS */}
            <tr className={darkMode ? "bg-white/3" : "bg-[#FAFBFC]"}>
              {groups.map((group) => (
                <Fragment key={group.key}>
                  {group.items.map((item) => (
                    <th key={item.id} className={`border px-2 py-2 text-center font-bold ${panelBorder} ${textMuted}`}>
                      {columnLabel(item, group.key)}
                    </th>
                  ))}
                  <th className={`border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`}>Total</th>
                  <th className={`border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`}>PS</th>
                  <th className={`border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`}>WS</th>
                </Fragment>
              ))}
            </tr>
            {/* Row 3: Highest Possible Score */}
            <tr className={darkMode ? "bg-white/2" : "bg-white"}>
              {groups.map((group) => {
                const highest = group.items.reduce((sum, i) => sum + i.maxItems, 0);
                return (
                  <Fragment key={group.key}>
                    {group.items.map((item) => (
                      <td key={item.id} className={`border px-2 py-2 text-center font-bold ${panelBorder} ${textMuted}`}>
                        {item.maxItems}
                      </td>
                    ))}
                    <td className={`border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: ACCENT }}>
                      {highest || "—"}
                    </td>
                    <td className={`border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: ACCENT }}>
                      {highest ? "100.00" : "—"}
                    </td>
                    <td className={`border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: ACCENT }}>
                      {highest ? `${group.weightLabel}` : "—"}
                    </td>
                  </Fragment>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {grouped.male.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={columnCount}
                    className={`border px-3 py-2 text-left text-xs font-black uppercase ${panelBorder} ${darkMode ? "bg-white/10" : "bg-[#F1F2F4]"} ${textPrimary}`}
                  >
                    Male
                  </td>
                </tr>
                {grouped.male.map((student, index) => renderStudentRow(student, index))}
              </>
            )}
            {grouped.female.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={columnCount}
                    className={`border px-3 py-2 text-left text-xs font-black uppercase ${panelBorder} ${darkMode ? "bg-white/10" : "bg-[#F1F2F4]"} ${textPrimary}`}
                  >
                    Female
                  </td>
                </tr>
                {grouped.female.map((student, index) => renderStudentRow(student, index))}
              </>
            )}
            {roster.length === 0 && (
              <tr>
                <td colSpan={columnCount} className={`px-5 py-12 text-center text-sm font-semibold ${textMuted}`}>
                  No students enrolled yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {groups.every((g) => g.items.length === 0) && (
        <p className={`px-5 py-6 text-center text-sm font-semibold ${textMuted}`}>
          No Written Works, Performance Task, or Exam items recorded yet for this term.
        </p>
      )}

      {/* Confirmation modal — last look before grades leave this page and
          land on the adviser's gradesheet. Only reachable once every
          component is fully scored (handleSubmitClick already gates that). */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            className={`flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border shadow-xl ${panelBorder} ${
              darkMode ? "bg-[#111827]" : "bg-white"
            }`}
          >
            <div className={`flex items-center justify-between border-b px-5 py-4 ${panelBorder}`}>
              <div>
                <h3 className={`text-sm font-black uppercase tracking-wide ${textPrimary}`}>Confirm Submission</h3>
                <p className={`mt-1 text-xs font-semibold ${textMuted}`}>
                  This sends {roster.length} {roster.length === 1 ? "grade" : "grades"} to{" "}
                  {adviserName ? `${adviserName}'s` : "the adviser's"} gradesheet. Review before confirming.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className={`rounded-lg p-1.5 ${darkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                aria-label="Close"
              >
                <X className={`h-4 w-4 ${textMuted}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${panelBorder} ${textMuted}`}>
                    <th className="py-2 text-left font-black uppercase">Student</th>
                    <th className="py-2 text-center font-black uppercase">Preview Grade</th>
                    <th className="py-2 text-center font-black uppercase">Term Grade</th>
                    <th className="py-2 text-center font-black uppercase">Remarks</th>
                    <th className="py-2 text-left font-black uppercase">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {gradePreviews.map((preview) => (
                    <tr key={preview.id} className={`border-b ${panelBorder}`}>
                      <td className={`py-2 font-bold ${textPrimary}`}>{preview.name}</td>
                      <td className="py-2 text-center font-bold tabular-nums" style={{ color: ACCENT }}>
                        {preview.previewGrade.toFixed(2)}
                      </td>
                      <td className="py-2 text-center font-black tabular-nums" style={{ color: ACCENT }}>
                        {preview.termGrade}
                      </td>
                      <td className="py-2 text-center">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
                          style={{
                            backgroundColor: preview.remarks === "PASSED" ? "#DCFCE7" : "#FEE2E2",
                            color: preview.remarks === "PASSED" ? "#16A34A" : "#DC2626",
                          }}
                        >
                          {preview.remarks}
                        </span>
                      </td>
                      <td className={`py-2 font-semibold ${textMuted}`}>{preview.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {submitError && (
              <div className="px-5 pb-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {submitError}
                </span>
              </div>
            )}

            <div className={`flex items-center justify-end gap-2 border-t px-5 py-4 ${panelBorder}`}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className={`h-9 rounded-xl border px-4 text-xs font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50 ${panelBorder} ${textPrimary}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-maroon-gradient px-4 text-xs font-bold uppercase tracking-wide text-white shadow-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? "Submitting…" : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar — surfaces both the "grades incomplete" block and any
          submission failure/success, without needing the button itself
          to stay permanently disabled. */}
      {snackbar && (
        <div className="fixed bottom-5 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
          <div
            className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-xl"
            style={{ backgroundColor: snackbar.type === "error" ? "#DC2626" : "#16A34A" }}
          >
            {snackbar.type === "error" ? (
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span className="flex-1">{snackbar.message}</span>
            <button type="button" onClick={() => setSnackbar(null)} aria-label="Dismiss">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}