import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { rememberColumns, useColumnReservation } from "@shared/loading/reservations";
import { Children, cloneElement, isValidElement, Fragment, useMemo, useRef, useState, type ReactNode, type ReactElement } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import { AlertTriangle, CheckCircle2, Download, Send, X } from "lucide-react";
import { ConfirmationModal } from "@shared/components/ConfirmationModal";
import type { RosterStudent } from "./data";
import {
  formatShortDate,
  type GradeItem,
  type ScoreMap,
} from "./types/Grading";
import {
  computePS,
  computeWS,
  computeTransmutedGrade,
} from "./utils/GradeWeights";
import { submitGrades } from "../services/subjectGrading.service";
import { downloadGradeRecordExport } from "../services/subjectGradeTemplate.service";
import type { GradeTemplateStructure, TemplateDomain, TemplateExamComponent, TemplateExaminations } from "../../../../shared/grading/gradeTemplate.types";

const INCOMPLETE_COLOR = "#CA8A04";

function MissingScoreDot({ missingIn }: { missingIn: string[] }) {
  return (
    <span
      title={`Missing score(s) in: ${missingIn.join(", ")}`}
      aria-label={`Missing score(s) in: ${missingIn.join(", ")}`}
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: INCOMPLETE_COLOR }}
    />
  );
}

type GenderedStudent = RosterStudent & { gender?: "M" | "F" };

interface ScoreColumn {
  id: string;
  item?: GradeItem;
  label: string;
  maxItems?: number;
}

interface DomainColumnGroup {
  id: string;
  label: string;
  weightPercent: number;
  items: GradeItem[];
  columns: ScoreColumn[];
}

interface ComponentColumnGroup {
  key: "writtenWorks" | "performanceTask" | "exams";
  label: string;
  weightLabel: string;
  weight: number;
  items: GradeItem[];
  domains?: TemplateDomain[];
  columns: ScoreColumn[];
  domainGroups?: DomainColumnGroup[];
  examComponents?: { component: TemplateExamComponent; columns: ScoreColumn[]; items: GradeItem[]; showWeightedScore: boolean }[];
  examOutputs?: { percentageScore: boolean; weightedScore: boolean };
  templateCapacity?: number;
  capacityOverflow?: number;
}

interface AssessmentRecordsSectionProps {
  subjectSectionId: string;
  title: string;
  roster: GenderedStudent[];
  items: GradeItem[];
  scores: ScoreMap;
  // examSubWeights is optional: present only when this subject has an
  // active uploaded DepEd .xlsx template (subject_grade_templates). When
  // absent, the exams group falls back to the original pooled behavior —
  // this keeps subjects without a template working exactly as before
  // (the "grandfathered" rollout behavior).
  weights: { ww: number; pt: number; exam: number; examSubWeights?: { st1: number; st2: number; te: number }; examinations?: TemplateExaminations; templateStructure?: GradeTemplateStructure } | null;
  loading?: boolean;
  term: string;
  isEditing: boolean;
  onScoreChange: (studentId: string, itemId: string, maxItems: number, rawValue: string) => void;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  isOwnAdvisory?: boolean;
  adviserName?: string;
}

interface StudentGroupTotals {
  total: number;
  highestPossible: number;
  scoredCount: number;
  totalItems: number;
  isComplete: boolean;
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

interface GroupResult {
  total: number;       // raw sum across the group's items — display only
  ps: number | null;
  ws: number | null;
  hasAnyItems: boolean;
  isComplete: boolean;
}

// Use the normalized pinned examination schema. ALL is retained for the
// legacy manually configured pooled-exam case.
function computeGroupResult(
  group: ComponentColumnGroup,
  studentId: string,
  scores: ScoreMap,
  examinations: TemplateExaminations | undefined,
): GroupResult {
  const pooled = studentTotals(group.items, studentId, scores);

  if (group.key !== "exams" && group.domains && group.domains.length > 1) {
    let weightedScore = 0;
    const validDomainIds = new Set(group.domains.map((domain) => domain.id));
    let complete = !group.items.some((item) => item.templateDomainId && !validDomainIds.has(item.templateDomainId));
    let hasItems = false;
    for (const domain of group.domains) {
      const totals = studentTotals(group.items.filter((item) => item.templateDomainId === domain.id), studentId, scores);
      hasItems ||= totals.totalItems > 0;
      if (!totals.totalItems || !totals.isComplete || !totals.highestPossible) {
        complete = false;
        continue;
      }
      weightedScore += ((totals.total / totals.highestPossible) * 100 * domain.weightPercent) / 100;
    }
    const ws = complete && hasItems ? weightedScore : null;
    return {
      total: pooled.total,
      ps: ws === null || !group.weight ? null : (ws / group.weight) * 100,
      ws,
      hasAnyItems: pooled.totalItems > 0,
      isComplete: complete && hasItems,
    };
  }

  if (group.key !== "exams" || !examinations?.enabled) {
    const ps = computePS(pooled.total, pooled.highestPossible);
    const ws = computeWS(ps, group.weight);
    return {
      total: pooled.total,
      ps,
      ws,
      hasAnyItems: pooled.totalItems > 0,
      isComplete: pooled.totalItems > 0 && pooled.isComplete,
    };
  }
  let ps = 0;
  let complete = true;
  let hasAnyItems = false;
  for (const component of examinations.components) {
    const componentItems = component.key.toUpperCase() === "ALL"
      ? group.items
      : group.items.filter((item) => String(item.examType || "").toUpperCase() === component.key.toUpperCase());
    const totals = studentTotals(componentItems, studentId, scores);
    hasAnyItems ||= totals.totalItems > 0;
    if (!totals.totalItems || !totals.isComplete || !totals.highestPossible) {
      complete = false;
      continue;
    }
    ps += ((totals.total / totals.highestPossible) * 100 * component.weightPercent) / 100;
  }
  complete &&= hasAnyItems;
  return { total: pooled.total, ps: complete ? ps : null, ws: complete ? computeWS(ps, group.weight) : null, hasAnyItems, isComplete: complete };
}

function makeGroupColumns(
  key: ComponentColumnGroup["key"],
  items: GradeItem[],
  domains: TemplateDomain[] | undefined,
  examinations?: TemplateExaminations,
): { columns: ScoreColumn[]; domainGroups?: DomainColumnGroup[]; templateCapacity?: number; capacityOverflow?: number; examComponents?: { component: TemplateExamComponent; columns: ScoreColumn[]; items: GradeItem[]; showWeightedScore: boolean }[]; examOutputs?: { percentageScore: boolean; weightedScore: boolean } } {
  if (key === "exams") {
    const hasMappedColumn = (column: number | undefined) => column !== undefined
      && column !== null
      && Number.isFinite(Number(column));
    const examComponents = (examinations?.components ?? []).map((component) => {
      const examItems = component.key.toUpperCase() === "ALL"
        ? items
        : items.filter((item) => String(item.examType || "").toUpperCase() === component.key.toUpperCase());
      const isPooled = component.key.toUpperCase() === "ALL";
      const columns = isPooled
        ? Array.from({ length: Math.max(1, examItems.length) }, (_, index) => {
          const item = examItems[index];
          return { id: item?.id ?? `template-${component.key}-${index}`, item, label: String(index + 1), maxItems: item?.maxItems };
        })
        : [{
          id: `template-${component.key}`,
          item: examItems.length === 1 ? examItems[0] : undefined,
          label: component.label,
          maxItems: examItems.length ? examItems.reduce((sum, item) => sum + item.maxItems, 0) : undefined,
        }];
      return {
        component,
        columns,
        items: examItems,
        showWeightedScore: hasMappedColumn(component.weightedScoreColumn),
      };
    });
    const outputs = examinations?.outputs;
    return {
      columns: examComponents.flatMap(({ columns }) => columns),
      examComponents,
      // Templates provide their mapped outputs. Manual pooled exams predate
      // the template schema and retain their existing PS/WS summary columns.
      examOutputs: {
        percentageScore: outputs ? hasMappedColumn(outputs.percentageScoreColumn) : true,
        weightedScore: outputs ? hasMappedColumn(outputs.weightedScoreColumn) : true,
      },
    };
  }

  // Without template domains, keep the existing component-level Total/PS/WS
  // layout. Only split the table into per-domain summaries when the uploaded
  // template actually defines those domains.
  if (!domains?.length) {
    return {
      columns: items.map((item, index) => ({
        id: item.id,
        item,
        label: String(index + 1),
        maxItems: item.maxItems,
      })),
    };
  }

  const domainGroups: DomainColumnGroup[] = [];
  const columns: ScoreColumn[] = [];
  const assignedItems = new Set<string>();
  let templateCapacity = 0;
  let capacityOverflow = 0;
  for (const domain of domains ?? []) {
    const domainItems = items.filter((item) =>
      (domains?.length ?? 0) > 1 ? item.templateDomainId === domain.id : true,
    );
    domainItems.forEach((item) => assignedItems.add(item.id));
    const slotCount = domain.scoreColumns?.length ?? 0;
    templateCapacity += slotCount;
    capacityOverflow += Math.max(0, domainItems.length - slotCount);
    const count = Math.max(slotCount, domainItems.length);
    const domainColumns: ScoreColumn[] = [];
    for (let index = 0; index < count; index += 1) {
      const item = domainItems[index];
      domainColumns.push({
        id: item?.id ?? `template-${domain.id}-${index}`,
        item,
        label: String(index + 1),
        maxItems: item?.maxItems,
      });
    }
    if (domains.length > 1) {
      domainGroups.push({
        id: domain.id,
        label: domain.label || "Assessment Domain",
        weightPercent: domain.weightPercent,
        items: domainItems,
        columns: domainColumns,
      });
    }
    columns.push(...domainColumns);
  }

  // Preserve items that have no matching domain (for example, an item
  // created before a template was uploaded) instead of hiding their scores.
  for (const item of items) {
    if (!assignedItems.has(item.id)) {
      if (domains.length > 1) capacityOverflow += 1;
      const column = { id: item.id, item, label: String(columns.length + 1), maxItems: item.maxItems };
      columns.push(column);
      domainGroups.push({
        id: `unassigned-${item.id}`,
        label: "Unassigned",
        weightPercent: 0,
        items: [item],
        columns: [column],
      });
    }
  }
  return {
    columns,
    domainGroups: domainGroups.length > 0 ? domainGroups : undefined,
    templateCapacity,
    capacityOverflow,
  };
}

function computeStudentGrade(
  student: GenderedStudent,
  groups: ComponentColumnGroup[],
  scores: ScoreMap,
  examinations: TemplateExaminations | undefined,
): { initialGrade: number | null; anyGroupIncomplete: boolean; isComplete: boolean } {
  const weightedScores: number[] = [];
  let anyGroupIncomplete = false;
  let isComplete = true;

  groups.forEach((group) => {
    const result = computeGroupResult(group, student.id, scores, examinations);
    if (!result.isComplete) { anyGroupIncomplete = true; isComplete = false; }
    if (result.ws !== null) weightedScores.push(result.ws);
  });

  const initialGrade = isComplete && weightedScores.length === groups.length
    ? weightedScores.reduce((sum, value) => sum + value, 0)
    : null;

  return { initialGrade, anyGroupIncomplete, isComplete };
}

function getRemarks(termGrade: number): "PASSED" | "FAILED" {
  return termGrade >= 75 ? "PASSED" : "FAILED";
}

interface StudentGradePreview {
  id: string;
  name: string;
  previewGrade: number;
  termGrade: number | null;
  remarks: "PASSED" | "FAILED" | null;
  description: string;
}

export function AssessmentRecordsSection({
  subjectSectionId,
  title,
  roster,
  items,
  scores,
  weights: resolvedWeights,
  loading = false,
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
  // Zero values are layout sentinels only while rules are unknown; never grade with them.
  const weights = resolvedWeights ?? { ww: 0, pt: 0, exam: 0 };
  const view = `subject-records:${subjectSectionId}:${term}`;
  const table = useRef<HTMLTableElement>(null);
  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;
  const cellInputClasses = `w-14 rounded-md border px-1 py-0.5 text-center text-xs font-bold outline-none ${panelBorder} ${
    darkMode ? "bg-panel-dark text-white" : "bg-white text-[#111827]"
  }`;

  const examinations: TemplateExaminations = weights.examinations
    ?? weights.templateStructure?.examinations
    ?? (weights.examSubWeights
      ? { enabled: true, categoryWeightPercent: weights.exam, components: [
        { key: "ST1", label: "ST1", weightPercent: weights.examSubWeights.st1 },
        { key: "ST2", label: "ST2", weightPercent: weights.examSubWeights.st2 },
        { key: "TE", label: "TE", weightPercent: weights.examSubWeights.te },
      ] }
      : loading || weights.exam > 0
        ? { enabled: true, categoryWeightPercent: weights.exam, components: [{ key: "ALL", label: "Examinations", weightPercent: 100 }] }
        : { enabled: false, categoryWeightPercent: 0, components: [] });

  async function exportClassRecord() {
    try {
      if (!term) throw new Error("Choose a grading period before exporting.");
      const { buffer, fileName } = await downloadGradeRecordExport(subjectSectionId, term);
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
      const exportedTerm = fileName.match(/TERM-(\d+)/i)?.[1];
      setSnackbar({
        type: "success",
        message: exportedTerm
          ? `Term ${exportedTerm} class record exported successfully.`
          : "Class record exported successfully.",
      });
    } catch (err) {
      setSnackbar({ type: "error", message: err instanceof Error ? err.message : "Excel export failed." });
    }
  }
  const groups: ComponentColumnGroup[] = useMemo(() => {
    const forTerm = (t: GradeItem["tab"]) =>
      items.filter((i) => i.tab === t && (!term || i.gradingPeriodId === term)).sort((a, b) => a.date.localeCompare(b.date));
    const wwItems = forTerm("writtenWorks");
    const ptItems = forTerm("performanceTask");
    const examItems = forTerm("exams");
    const wwDomains = weights.templateStructure?.ww.domains;
    const ptDomains = weights.templateStructure?.pt.domains;
    const wwLayout = makeGroupColumns("writtenWorks", wwItems, wwDomains);
    const ptLayout = makeGroupColumns("performanceTask", ptItems, ptDomains);
    const examLayout = makeGroupColumns("exams", examItems, undefined, examinations);
    const groups: ComponentColumnGroup[] = [];
    if (loading || weights.ww > 0) groups.push({ key: "writtenWorks", label: "Written / Oral Works", weightLabel: `${weights.ww}%`, weight: weights.ww, items: wwItems, domains: wwDomains, ...wwLayout });
    if (loading || weights.pt > 0) groups.push({ key: "performanceTask", label: "Product / Performance Tasks", weightLabel: `${weights.pt}%`, weight: weights.pt, items: ptItems, domains: ptDomains, ...ptLayout });
    if (loading || (examinations.enabled && weights.exam > 0)) groups.push({ key: "exams", label: "Examinations", weightLabel: `${weights.exam}%`, weight: weights.exam, items: examItems, ...examLayout });
    return groups;
  }, [items, term, weights, examinations, loading]);

  const grouped = useMemo(() => {
    const male = roster.filter((s) => s.gender !== "F");
    const female = roster.filter((s) => s.gender === "F");
    return { male, female };
  }, [roster]);

  const isFullyGraded = useMemo(() => {
    if (roster.length === 0) return false;
    return roster.every((student) =>
      groups.every((group) => {
        const result = computeGroupResult(group, student.id, scores, examinations);
        return result.isComplete;
      }),
    );
  }, [roster, groups, scores, examinations]);

  const incompleteReasons = useMemo(() => {
    const reasons: string[] = [];
    groups.forEach((group) => {
      if (group.items.length === 0) return;
      const anyMissing = roster.some((student) => {
        const result = computeGroupResult(group, student.id, scores, examinations);
        return !result.isComplete;
      });
      if (anyMissing) reasons.push(group.label);
    });
    return reasons;
  }, [groups, roster, scores, examinations]);

  const gradePreviews: StudentGradePreview[] = useMemo(() => {
    return roster.map((student) => {
      const { initialGrade } = computeStudentGrade(student, groups, scores, examinations);
      const termGrade = computeTransmutedGrade(initialGrade, weights.templateStructure?.transmutationTable);
      const remarks = termGrade === null ? null : getRemarks(termGrade);
      const description = termGrade === null ? "Template transmutation table unavailable" : (weights.templateStructure?.descriptorTable.find((row) => row.numericalGrade === termGrade)?.descriptor ?? "");
      const previewGrade = initialGrade ?? 0;
      return { id: student.id, name: student.name, previewGrade, termGrade, remarks, description };
    });
  }, [roster, groups, scores, examinations, weights.templateStructure?.descriptorTable, weights.templateStructure?.transmutationTable]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [snackbar, setSnackbar] = useState<{ type: "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    if (!snackbar) return;
    const timeout = window.setTimeout(() => setSnackbar(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [snackbar]);

  function handleSubmitClick() {
    if (isSubmitting) return;
    if (!weights.templateStructure?.transmutationTable?.length) {
      setSnackbar({ type: "error", message: "This subject has no active grade template with transmutation rules. Ask an admin to upload the approved template before submitting grades." });
      return;
    }
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

  const groupColumnSpan = (group: ComponentColumnGroup) => group.key === "exams"
    ? group.columns.length
      + (group.examComponents?.filter((entry) => entry.showWeightedScore).length ?? 0)
      + Number(!!group.examOutputs?.percentageScore)
      + Number(!!group.examOutputs?.weightedScore)
    : group.columns.length + 3 * (group.domainGroups?.length || 1);
  const columnCount = 1 + groups.reduce((sum, group) => sum + groupColumnSpan(group), 0) + 3;

  function renderStudentRow(student: GenderedStudent, index: number, pending: boolean) {
    let anyGroupIncomplete = false;
    const missingIn: string[] = [];

    const groupCells = groups.map((group) => {
      const result = computeGroupResult(group, student.id, scores, examinations);

      if (!result.isComplete) {
        anyGroupIncomplete = true;
        missingIn.push(group.label);
      }
      if (group.key === "exams" && group.examComponents) {
        const componentWeightedCells = group.examComponents
          .filter(({ showWeightedScore }) => showWeightedScore)
          .map(({ component, items }) => {
            const totals = studentTotals(items, student.id, scores);
            const ps = totals.totalItems > 0 && totals.isComplete
              ? computePS(totals.total, totals.highestPossible)
              : null;
            return { component, ws: computeWS(ps, component.weightPercent) };
          });
        return (
          <Fragment key={group.key}>
            {group.examComponents.map(({ component, columns, items }) => columns.map((column) => {
              const totals = studentTotals(items, student.id, scores);
              const componentItems = component.key.toUpperCase() === "ALL" ? (column.item ? [column.item] : []) : items;
              const rawValue = component.key.toUpperCase() === "ALL"
                ? column.item ? scores[student.id]?.[column.item.id] ?? "—" : "—"
                : items.length === 1
                  ? scores[student.id]?.[items[0].id] ?? "—"
                  : totals.isComplete ? totals.total : "—";
              const title = items.length > 1
                ? `${items.map((item) => `${item.activityName} · ${formatShortDate(item.date)}`).join("; ")} · values combine into ${component.label}.`
                : column.item ? `${column.item.activityName} · ${formatShortDate(column.item.date)}` : "No examination score recorded";
              return (
                <td key={column.id} title={title} className="min-w-14 whitespace-nowrap px-2 py-2.5 text-center text-xs font-bold tabular-nums">
                  {isEditing && componentItems.length > 0 && component.key.toUpperCase() !== "ALL" && componentItems.length > 1 ? (
                    <span className="inline-flex flex-wrap justify-center gap-1">
                      {componentItems.map((item) => <input key={item.id} type="number" min={0} max={item.maxItems} step="1" inputMode="numeric"
                        aria-label={`${component.label}: ${item.activityName}`}
                        title={`${item.activityName} · ${formatShortDate(item.date)}`}
                        value={scores[student.id]?.[item.id] ?? ""}
                        onChange={(event) => onScoreChange(student.id, item.id, item.maxItems, event.target.value)}
                        className={cellInputClasses} />)}
                    </span>
                  ) : isEditing && componentItems.length === 1 ? (
                    <input type="number" min={0} max={componentItems[0].maxItems} step="1" inputMode="numeric"
                      aria-label={`${component.label} score`} title={`${componentItems[0].activityName} · ${formatShortDate(componentItems[0].date)}`}
                      value={scores[student.id]?.[componentItems[0].id] ?? ""}
                      onChange={(event) => onScoreChange(student.id, componentItems[0].id, componentItems[0].maxItems, event.target.value)}
                      className={cellInputClasses} />
                  ) : rawValue}
                </td>
              );
            }))}
            {componentWeightedCells.map(({ component, ws }) => (
              <td key={`ws-${component.key}`} className="min-w-16 whitespace-nowrap px-2 py-2.5 text-center text-xs font-bold tabular-nums">{ws === null ? "—" : ws.toFixed(2)}</td>
            ))}
            {group.examOutputs?.percentageScore && <td className="min-w-16 whitespace-nowrap px-2 py-2.5 text-center text-xs font-bold tabular-nums">{result.ps === null ? "—" : result.ps.toFixed(2)}</td>}
            {group.examOutputs?.weightedScore && <td className="min-w-16 whitespace-nowrap px-2 py-2.5 text-center text-xs font-bold tabular-nums">{result.ws === null ? "—" : result.ws.toFixed(2)}</td>}
          </Fragment>
        );
      }

      return (
        <Fragment key={group.key}>
          {group.domainGroups?.length ? group.domainGroups.map((domain) => {
            const totals = studentTotals(domain.items, student.id, scores);
            const ps = computePS(totals.total, totals.highestPossible);
            const ws = computeWS(ps, domain.weightPercent);
            return (
              <Fragment key={domain.id}>
                {domain.columns.map((column) => (
                  <td key={column.id} className="min-w-14 whitespace-nowrap px-2 py-2.5 text-center text-xs font-bold tabular-nums">
                    {column.item && isEditing ? (
                      <input
                        type="number"
                        min={0}
                        max={column.item.maxItems}
                        step="1"
                        inputMode="numeric"
                        value={scores[student.id]?.[column.item.id] ?? ""}
                        onChange={(e) => onScoreChange(student.id, column.item!.id, column.item!.maxItems, e.target.value)}
                        className={cellInputClasses}
                      />
                    ) : (
                      column.item ? scores[student.id]?.[column.item.id] ?? "—" : "—"
                    )}
                  </td>
                ))}
                <td className="px-2 py-2.5 text-center text-xs font-black tabular-nums" style={{ color: "var(--brand-ink)" }}>
                  {totals.totalItems ? totals.total : "—"}
                </td>
                <td className="px-2 py-2.5 text-center text-xs font-bold tabular-nums">
                  {ps !== null ? ps.toFixed(2) : "—"}
                </td>
                <td className="px-2 py-2.5 text-center text-xs font-bold tabular-nums">
                  {ws !== null ? ws.toFixed(2) : "—"}
                </td>
              </Fragment>
            );
          }) : (
            <>
              {group.columns.map((column) => (
                <td key={column.id} className="min-w-14 whitespace-nowrap px-2 py-2.5 text-center text-xs font-bold tabular-nums">
                  {column.item && isEditing ? (
                    <input
                      type="number"
                      min={0}
                      max={column.item.maxItems}
                      step="1"
                      inputMode="numeric"
                      value={scores[student.id]?.[column.item.id] ?? ""}
                      onChange={(e) => onScoreChange(student.id, column.item!.id, column.item!.maxItems, e.target.value)}
                      className={cellInputClasses}
                    />
                  ) : (
                    column.item ? scores[student.id]?.[column.item.id] ?? "—" : "—"
                  )}
                </td>
              ))}
              <td className="px-2 py-2.5 text-center text-xs font-black tabular-nums" style={{ color: "var(--brand-ink)" }}>
                {!result.hasAnyItems ? "—" : result.total}
              </td>
              <td className="px-2 py-2.5 text-center text-xs font-bold tabular-nums">
                {result.ps !== null ? result.ps.toFixed(2) : "—"}
              </td>
              <td className="px-2 py-2.5 text-center text-xs font-bold tabular-nums">
                {result.ws !== null ? result.ws.toFixed(2) : "—"}
              </td>
            </>
          )}
        </Fragment>
      );
    });

    const { initialGrade } = computeStudentGrade(student, groups, scores, examinations);
    const termGrade = computeTransmutedGrade(initialGrade, weights.templateStructure?.transmutationTable);
    const descriptor = termGrade === null
      ? null
      : weights.templateStructure?.descriptorTable.find((row) => row.numericalGrade === termGrade)?.descriptor ?? null;

    return (
      <tr key={student.id} data-sk-region="subject-record-student" className={`border-t ${panelBorder} ${index % 2 ? (darkMode ? "bg-white/1.5" : "bg-black/[0.012]") : ""}`}>
        <td className={`sticky left-0 z-20 min-w-60 border-r px-4 py-2.5 text-sm font-bold shadow-[2px_0_4px_rgba(15,23,42,0.05)] ${darkMode ? "bg-panel-dark" : index % 2 ? "bg-[#FCFCFD]" : "bg-white"} ${panelBorder} ${textPrimary}`}>
          <span className="inline-flex items-center gap-1.5">
            <StudentAvatar gender={student.gender} name={student.name} />
            {student.name}
            {!pending && anyGroupIncomplete && <MissingScoreDot missingIn={missingIn} />}
          </span>
        </td>
        {pending ? maskCells(groupCells) : groupCells}
        <td className="px-3 py-2.5 text-center text-sm font-black tabular-nums" style={{ color: "var(--brand-ink)" }}>
          {pending ? <SkeletonText width="5ch" className="mx-auto" /> : initialGrade !== null ? initialGrade.toFixed(2) : "—"}
        </td>
        <td className="px-3 py-2.5 text-center text-sm font-black tabular-nums" style={{ color: "var(--brand-ink)" }}>
          {pending ? <SkeletonText width="3ch" className="mx-auto" /> : termGrade ?? "—"}
        </td>
        <td className="px-3 py-2.5 text-center text-sm font-semibold">
          {pending ? <SkeletonParagraph field={`${view}:descriptor:${student.id}`} typical={2} width="100%" /> : descriptor ?? "—"}
        </td>
      </tr>
    );
  }

  const columnWidths = useColumnReservation(view, [
    { label: "Learners' Names", typical: "Maria Alexandra Delos Santos" },
    ...groups.flatMap(group => Array.from({length: groupColumnSpan(group)}, (_, i) => ({label: String(i+1),typical:"100.00"}))),
    {label:"Initial Grade",typical:"100.00"},{label:"Term Grade",typical:"100"},{label:"Descriptor",typical:"Very Satisfactory"},
  ], loading);
  function maskCells(nodes: ReactNode): ReactNode {
    return Children.map(nodes, (node, index) => {
      if (!isValidElement(node)) return node;
      const element = node as ReactElement<{children?: ReactNode}>;
      return cloneElement(element, undefined, element.type === "td" || element.type === "th"
        ? <SkeletonText width={index % 2 ? "64%" : "92%"} className="mx-auto" />
        : maskCells(element.props.children));
    });
  }
  const hpsCells = groups.map((group) => <Fragment key={group.key}>
                {group.key === "exams" && group.examComponents ? <>
                  {group.examComponents.flatMap(({ columns }) => columns.map((column) => <th key={`${column.id}-hps`} className={`min-w-14 border px-2 py-2 text-center font-bold ${panelBorder} ${textMuted}`}>{column.maxItems ?? "—"}</th>))}
                  {group.examComponents.filter((entry) => entry.showWeightedScore).map(({ component }) => <th key={`${component.key}-weight`} className={`min-w-16 border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`} style={{ color: "var(--brand-ink)" }}>{component.weightPercent}%</th>)}
                  {group.examOutputs?.percentageScore && <th className={`min-w-16 border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: "var(--brand-ink)" }}>100.00</th>}
                  {group.examOutputs?.weightedScore && <th className={`min-w-16 border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: "var(--brand-ink)" }}>{group.weight}%</th>}
                </> : group.domainGroups?.length ? group.domainGroups.map((domain) => {
                  const highest = domain.items.reduce((sum, item) => sum + item.maxItems, 0);
                  return <Fragment key={domain.id}>
                    {domain.columns.map((column) => <th key={column.id} className={`min-w-14 border px-2 py-2 text-center font-bold ${panelBorder} ${textMuted}`}>{column.maxItems ?? "—"}</th>)}
                    <th className={`min-w-16 border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: "var(--brand-ink)" }}>{highest || "—"}</th><th className={`min-w-16 border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: "var(--brand-ink)" }}>100.00</th><th className={`min-w-16 border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: "var(--brand-ink)" }}>{domain.weightPercent}%</th>
                  </Fragment>;
                }) : <>
                  {group.columns.map((column) => <th key={column.id} className={`min-w-14 border px-2 py-2 text-center font-bold ${panelBorder} ${textMuted}`}>{column.maxItems ?? "—"}</th>)}
                  <th className={`min-w-16 border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: "var(--brand-ink)" }}>{group.items.reduce((sum, item) => sum + item.maxItems, 0) || "—"}</th>
                  <th className={`min-w-16 border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: "var(--brand-ink)" }}>{group.items.length || weights.templateStructure ? "100.00" : "—"}</th>
                  <th className={`min-w-16 border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: "var(--brand-ink)" }}>{group.items.length || weights.templateStructure ? group.weightLabel : "—"}</th>
                </>}
              </Fragment>);
  function renderRecordsTable(pending: boolean) { return (<div className="max-h-[68vh] overflow-auto">
        <table ref={table} className="teacher-user-table w-full min-w-max border-collapse text-xs">
          {pending && <colgroup>{columnWidths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>}
          <thead className={`sticky top-0 z-30 ${darkMode ? "bg-[#241311]" : "bg-white"}`}>
            <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
              <th rowSpan={3} className={`sticky left-0 z-50 w-60 min-w-60 border px-3 py-3 text-left text-sm font-black uppercase shadow-[2px_0_5px_rgba(15,23,42,0.08)] ${darkMode ? "bg-panel-dark" : "bg-brand-light"} ${panelBorder} ${textPrimary}`}>
                Learners' Names
              </th>
              {groups.map((group) => <th key={group.key} colSpan={groupColumnSpan(group)} className={`border px-2 py-3 text-center text-xs font-black uppercase ${panelBorder} ${textPrimary}`}>
                {group.label} ({pending ? <SkeletonText width="3ch" className="inline-block" /> : group.weightLabel})
              </th>)}
              <th rowSpan={3} className={`min-w-24 border px-3 py-3 text-center text-xs font-black uppercase ${panelBorder} ${textPrimary}`}>Initial<br />Grade</th>
              <th rowSpan={3} className={`min-w-24 border px-3 py-3 text-center text-xs font-black uppercase ${panelBorder} ${textPrimary}`}>Term<br />Grade</th>
              <th rowSpan={3} className={`min-w-32 border px-3 py-3 text-center text-xs font-black uppercase ${panelBorder} ${textPrimary}`}>Descriptor</th>
            </tr>
            <tr className={darkMode ? "bg-white/3" : "bg-brand-light"}>
              {groups.map((group) => <Fragment key={group.key}>
                {group.key === "exams" && group.examComponents ? <>
                  {group.examComponents.flatMap(({ component, columns }) => columns.map((column) => <th key={column.id} rowSpan={2} title={column.item ? `${column.item.activityName} · ${formatShortDate(column.item.date)}` : `${component.label} examination input`} className={`min-w-14 border px-2 py-2 text-center text-xs font-black uppercase ${panelBorder} ${textMuted}`}>{component.key.toUpperCase() === "ALL" ? column.label : component.label}</th>))}
                  {group.examComponents.filter((entry) => entry.showWeightedScore).map(({ component }) => <th key={`ws-${component.key}`} rowSpan={2} className={`min-w-16 border px-2 py-2 text-center text-xs font-black uppercase ${panelBorder} ${textMuted}`}>WS {component.label}</th>)}
                  {group.examOutputs?.percentageScore && <th rowSpan={2} className={`min-w-16 border px-2 py-2 text-center text-xs font-black uppercase ${panelBorder} ${textMuted}`}>PS</th>}
                  {group.examOutputs?.weightedScore && <th rowSpan={2} className={`min-w-16 border px-2 py-2 text-center text-xs font-black uppercase ${panelBorder} ${textMuted}`}>WS</th>}
                </> : group.domainGroups?.length ? group.domainGroups.map((domain) => <th key={domain.id} colSpan={domain.columns.length + 3} className={`border px-2 py-2 text-center text-xs font-black uppercase ${panelBorder} ${textMuted}`}>
                  {domain.label}{(group.domainGroups?.length ?? 0) > 1 || Math.abs(domain.weightPercent - group.weight) > 0.01 ? ` (${domain.weightPercent}%)` : ""}
                </th>) : <>
                  {group.columns.map((column) => <th key={column.id} rowSpan={2} title={column.item ? `${column.item.activityName} · ${formatShortDate(column.item.date)}` : "Empty template slot"} className={`min-w-14 border px-2 py-2 text-center text-xs font-black uppercase ${panelBorder} ${textMuted}`}>{column.label}</th>)}
                  <th rowSpan={2} className={`min-w-16 border px-2 py-2 text-center text-xs font-black uppercase ${panelBorder} ${textMuted}`}>Total</th>
                  <th rowSpan={2} className={`min-w-16 border px-2 py-2 text-center text-xs font-black uppercase ${panelBorder} ${textMuted}`}>PS</th>
                  <th rowSpan={2} className={`min-w-16 border px-2 py-2 text-center text-xs font-black uppercase ${panelBorder} ${textMuted}`}>WS</th>
                </>}
              </Fragment>)}
            </tr>
            <tr className={darkMode ? "bg-white/3" : "bg-brand-light"}>
              {groups.map((group) => <Fragment key={group.key}>
                {group.key === "exams" && group.examComponents ? null : group.domainGroups?.length ? group.domainGroups.map((domain) => <Fragment key={domain.id}>
                  {domain.columns.map((column) => <th key={column.id} title={column.item ? `${column.item.activityName} · ${formatShortDate(column.item.date)}` : "Empty template slot"} className={`min-w-14 border px-2 py-2 text-center font-bold ${panelBorder} ${textMuted}`}>{column.label}</th>)}
                  <th className={`min-w-16 border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`}>Total</th><th className={`min-w-16 border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`}>PS</th><th className={`min-w-16 border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`}>WS</th>
                </Fragment>) : null}
              </Fragment>)}
            </tr>
            <tr className={darkMode ? "bg-white/2" : "bg-white"}>
              <th className={`sticky left-0 z-50 min-w-60 border-r px-3 py-2 text-left text-xs font-black uppercase shadow-[2px_0_5px_rgba(15,23,42,0.08)] ${darkMode ? "bg-panel-dark" : "bg-white"} ${panelBorder} ${textMuted}`}>HPS</th>
              {pending ? maskCells(hpsCells) : hpsCells}
              <th className={`min-w-24 border px-2 py-2 ${panelBorder}`} aria-label="No HPS for Initial Grade" />
              <th className={`min-w-24 border px-2 py-2 ${panelBorder}`} aria-label="No HPS for Term Grade" />
              <th className={`min-w-32 border px-2 py-2 ${panelBorder}`} aria-label="No HPS for Descriptor" />
            </tr>
          </thead>
          <tbody>
            {grouped.male.length > 0 && (
              <>
                <tr>
                  <td className={`sticky left-0 z-20 min-w-60 border-r px-3 py-2 text-left text-xs font-black uppercase shadow-[2px_0_5px_rgba(15,23,42,0.05)] ${panelBorder} ${darkMode ? "bg-[#34201D]" : "bg-brand-light"} ${textPrimary}`}>Male</td>
                  <td colSpan={columnCount - 1} className={`border px-3 py-2 ${panelBorder} ${darkMode ? "bg-white/10" : "bg-brand-light"}`} />
                </tr>
                {grouped.male.map((student, index) => renderStudentRow(student, index, pending))}
              </>
            )}
            {grouped.female.length > 0 && (
              <>
                <tr>
                  <td className={`sticky left-0 z-20 min-w-60 border-r px-3 py-2 text-left text-xs font-black uppercase shadow-[2px_0_5px_rgba(15,23,42,0.05)] ${panelBorder} ${darkMode ? "bg-[#34201D]" : "bg-brand-light"} ${textPrimary}`}>Female</td>
                  <td colSpan={columnCount - 1} className={`border px-3 py-2 ${panelBorder} ${darkMode ? "bg-white/10" : "bg-brand-light"}`} />
                </tr>
                {grouped.female.map((student, index) => renderStudentRow(student, index, pending))}
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
      </div>); }

  return (
    <section className={cardClasses} aria-label={title}>
      <div className={`flex items-center justify-between gap-3 border-b px-4 py-2 ${panelBorder}`}>
        <span className={`text-xs font-semibold ${textMuted}`}>Export this term's assessment records using the official DepEd template configured for this subject.</span>
        <button type="button" onClick={() => void exportClassRecord()} disabled={loading} className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold ${panelBorder} ${textPrimary}`}>
          <Download size={13} /> Export DepEd Class Record
        </button>
      </div>
      {groups.some((group) => (group.capacityOverflow ?? 0) > 0) && (
        <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
          {groups.filter((group) => (group.capacityOverflow ?? 0) > 0)
            .map((group) => `${group.label}: ${group.capacityOverflow} assessment${group.capacityOverflow === 1 ? "" : "s"} exceed the assigned template's mapped slots`)
            .join(". ")}. Export is blocked until an appropriately mapped template is assigned; no assessments are hidden.
        </div>
      )}
      <LoadingRegion name="subject-assessment-records" loading={loading} variable autoColumns skeleton={null} frame={renderRecordsTable} retainPrevious hasContent={!!resolvedWeights && roster.length > 0} onSettled={() => rememberColumns(view, table.current)}>{null}</LoadingRegion>
      {!loading && groups.every((g) => g.items.length === 0) && (
        <p className={`px-5 py-6 text-center text-sm font-semibold ${textMuted}`}>
          {weights.templateStructure
            ? "The uploaded template columns are ready. Add assessment items from the subject assessment page to enable score entry for this term."
            : "No Written Works, Performance Task, or Exam items recorded yet for this term."}
        </p>
      )}

      {!isOwnAdvisory && (
        <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 ${panelBorder} ${darkMode ? "bg-white/5" : "bg-brand-light"}`}>
          <div className="flex flex-wrap items-center gap-3">
            {justSubmitted && (
              <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "#16A34A" }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Grades submitted
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={isSubmitting || loading}
            title={isSubmitting ? "Submitting…" : "Submit Grades"}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-maroon px-4 text-xs font-bold uppercase tracking-wide text-white shadow-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {isSubmitting ? "Submitting…" : "Submit Grades"}
          </button>
        </div>
      )}

      {showConfirmModal && (
        <ConfirmationModal
          title="Confirm Submission"
          description={
            <>
                  This sends {roster.length} {roster.length === 1 ? "grade" : "grades"} to{" "}
                  {adviserName ? `${adviserName}'s` : "the adviser's"} gradesheet. Review before confirming.
            </>
          }
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmSubmit}
          confirmLabel="Confirm & Submit"
          cancelLabel="Cancel"
          loadingLabel="Submitting…"
          variant="default"
          darkMode={darkMode}
          loading={isSubmitting}
          allowBackdropCloseWhileLoading
          disabled={isSubmitting}
          size="lg"
          panelClassName={`max-h-[85vh] rounded-2xl shadow-xl ${panelBorder} ${darkMode ? "bg-panel-dark" : "bg-white"}`}
          titleClassName={`uppercase ${textPrimary}`}
          descriptionClassName={textMuted}
          bodyClassName="space-y-3 px-5 pb-4 pt-0"
          footerClassName={`border-t px-5 py-4 ${panelBorder}`}
          cancelButtonClassName={`h-9 rounded-xl uppercase tracking-wide ${panelBorder} ${textPrimary}`}
          confirmButtonClassName="h-9 rounded-xl bg-maroon uppercase tracking-wide shadow-primary"
          confirmLeading={<Send className="h-3.5 w-3.5" />}
        >
          <>
              <table className="teacher-user-table w-full text-xs">
                <thead>
                  <tr className={`border-b ${panelBorder} ${textMuted}`}>
                    <th className="py-2 text-left font-black uppercase">Student</th>
                    <th className="py-2 text-center font-black uppercase">Initial Grade</th>
                    <th className="py-2 text-center font-black uppercase">Term Grade</th>
                    <th className="py-2 text-center font-black uppercase">Remarks</th>
                    <th className="py-2 text-left font-black uppercase">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {gradePreviews.map((preview) => (
                    <tr key={preview.id} className={`border-b ${panelBorder}`}>
                      <td className={`py-2 font-bold ${textPrimary}`}>{preview.name}</td>
                      <td className="py-2 text-center font-bold tabular-nums" style={{ color: "var(--brand-ink)" }}>
                        {preview.previewGrade.toFixed(2)}
                      </td>
                      <td className="py-2 text-center font-black tabular-nums" style={{ color: "var(--brand-ink)" }}>
                        {preview.termGrade ?? "—"}
                      </td>
                      <td className="py-2 text-center">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-black uppercase"
                          style={{
                            backgroundColor: preview.remarks === "PASSED" ? "#DCFCE7" : preview.remarks === "FAILED" ? "#FEE2E2" : "var(--border-subtle)",
                            color: preview.remarks === "PASSED" ? "#16A34A" : preview.remarks === "FAILED" ? "#DC2626" : "#6B7280",
                          }}
                        >
                          {preview.remarks ?? "Awaiting template"}
                        </span>
                      </td>
                      <td className={`py-2 font-semibold ${textMuted}`}>{preview.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            {submitError && (
              <div className="px-5 pb-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {submitError}
                </span>
              </div>
            )}
          </>

        </ConfirmationModal>
      )}

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

