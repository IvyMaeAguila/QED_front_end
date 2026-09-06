import { Fragment, useMemo } from "react";
import type { RosterStudent } from "./data";
import {
  formatShortDate,
  type ExamType,
  type GradeItem,
  type ScoreMap,
} from "./types/Grading";
import { computeInitialGrade, computePS, computeWS } from "./utils/GradeWeights";

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
  title: string;
  roster: GenderedStudent[];
  items: GradeItem[];
  scores: ScoreMap;
  weights: { ww: number; pt: number; exam: number };
  term: string;
  isEditing: boolean;
  onScoreChange: (studentId: string, itemId: string, maxItems: number, rawValue: string) => void;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
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

export function AssessmentRecordsSection({
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
    </section>
  );
}