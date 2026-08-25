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

function studentTotals(items: GradeItem[], studentId: string, scores: ScoreMap) {
  const scored = items.filter((item) => typeof scores[studentId]?.[item.id] === "number");
  const total = scored.reduce((sum, item) => sum + (scores[studentId]?.[item.id] ?? 0), 0);
  const highestPossible = scored.reduce((sum, item) => sum + item.maxItems, 0);
  return { total, highestPossible, scoredCount: scored.length };
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
    return (
      <tr key={student.id} className={`border-t ${panelBorder} ${index % 2 ? (darkMode ? "bg-white/1.5" : "bg-black/[0.012]") : ""}`}>
        <td className={`sticky left-0 z-10 px-4 py-2.5 text-sm font-bold ${darkMode ? "bg-[#111827]" : "bg-white"} ${textPrimary}`}>
          {student.name}
        </td>
        {groups.map((group) => {
          const { total, highestPossible } = studentTotals(group.items, student.id, scores);
          const ps = computePS(total, highestPossible);
          const ws = computeWS(ps, group.weight);
          if (ws !== null) weightedScores.push(ws);
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
              <td className="px-2 py-2.5 text-center text-xs font-black tabular-nums" style={{ color: ACCENT }}>
                {highestPossible ? total : "—"}
              </td>
              <td className="px-2 py-2.5 text-center text-xs font-bold tabular-nums">{ps !== null ? ps.toFixed(2) : "—"}</td>
              <td className="px-2 py-2.5 text-center text-xs font-bold tabular-nums">{ws !== null ? ws.toFixed(2) : "—"}</td>
            </Fragment>
          );
        })}
        <td className="px-3 py-2.5 text-center text-sm font-black tabular-nums" style={{ color: ACCENT }}>
          {computeInitialGrade(weightedScores[0] ?? null, weightedScores[1] ?? null, weightedScores[2] ?? null) ?? "—"}
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