import './AssessmentRecordsPage.css';
import { useToast } from "@shared/context/ToastContext";
import { ClassRecordExportModal } from "./ClassRecordExportModal";
import {transmutedTermGrade} from './utils/finalGrades';
import { computeStudentGrade, computeGroupResult, studentTotals } from './utils/assessmentGradeCalculation';
import {useTeacherAcademicServices} from '../../../query/TeacherAcademicQueryContext';
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { rememberColumns, rememberRows, skeletonRows, useColumnReservation } from "@shared/loading/reservations";
import { Children, cloneElement, isValidElement, Fragment, useEffect, useMemo, useRef, useState, type ReactNode, type ReactElement } from "react";

import { AlertTriangle, CheckCircle2, Download, Send } from "lucide-react";
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

import { downloadGradeRecordExport } from "../services/subjectGradeTemplate.service";
import type { GradeTemplateStructure, TemplateDomain, TemplateExamComponent, TemplateExaminations } from "../../../../shared/grading/gradeTemplate.types";

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

export interface ComponentColumnGroup {
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
  toolbarAction?: ReactNode;
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
  initialComponentId?: string;
  gradingRulesVerified?: boolean;
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
  initialComponentId = '',
  gradingRulesVerified = true,
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
  toolbarAction,
}: AssessmentRecordsSectionProps) {
  // Zero values are layout sentinels only while rules are unknown; never grade with them.
  const [selectedComponentId, setSelectedComponentId] = useState(initialComponentId);
  const component = resolvedWeights?.templateStructure?.components?.find(c => c.id === selectedComponentId) ?? resolvedWeights?.templateStructure?.components?.[0];
  const weights = component && resolvedWeights ? {...resolvedWeights, ww:component.ww.weightPercent,pt:component.pt.weightPercent,exam:component.examWeightPercent,examinations:component.examinations,examSubWeights:component.examSubWeights,templateStructure:{...resolvedWeights.templateStructure!,...component,components:undefined}} : resolvedWeights ?? { ww: 0, pt: 0, exam: 0 };
  const combinedGrade = (id:string) => resolvedWeights ? transmutedTermGrade(id,term,items,scores,{source:'template',...resolvedWeights}) : null;
  const view = `subject-records:${subjectSectionId}:${term}`;
  const recordSection = useRef<HTMLElement>(null);
  const cardClasses = `overflow-hidden rounded-[12px] border shadow-sm ${panelBg} ${panelBorder}`;
  const cellInputClasses = `w-14 rounded-lg border px-1 py-0.5 text-center text-xs font-bold outline-none ${panelBorder} ${
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

  const [exportState, setExportState] = useState<"idle" | "loading" | "success">("idle");
  const exportInFlight = useRef(false);
  async function exportClassRecord() {
    if (exportInFlight.current) return;
    exportInFlight.current = true;
    try {
      if (!term) throw new Error("Choose a grading period before exporting.");
      setExportState("loading");
      const { buffer, fileName } = await downloadGradeRecordExport(subjectSectionId, term);
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
      setExportState("success");
    } catch (err) {
      setSnackbar({ type: "error", message: err instanceof Error ? err.message : "Excel export failed." });
      setExportState("idle");
    } finally {
      exportInFlight.current = false;
    }
  }
  const groups: ComponentColumnGroup[] = useMemo(() => {
    const forTerm = (t: GradeItem["tab"]) =>
      items.filter((i) => (!component || i.templateDomainId === component.id || i.templateDomainId?.startsWith(component.id + '__')) && i.tab === t && (!term || i.gradingPeriodId === term)).sort((a, b) => a.date.localeCompare(b.date));
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
  }, [items, term, weights, examinations, loading, component]);

  const grouped = useMemo(() => {
    const male = roster.filter((s) => s.gender !== "F");
    const female = roster.filter((s) => s.gender === "F");
    return { male, female };
  }, [roster]);

  const isFullyGraded = useMemo(() => {
    if (roster.length === 0) return false;
    if (component) return roster.every(student => combinedGrade(student.id) !== null);
    return roster.every((student) =>
      groups.every((group) => {
        const result = computeGroupResult(group, student.id, scores, examinations);
        return result.isComplete;
      }),
    );
  }, [roster, groups, scores, examinations, component, resolvedWeights, items, term]);

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
      const termGrade = component ? combinedGrade(student.id) : computeTransmutedGrade(initialGrade, weights.templateStructure?.transmutationTable, weights.templateStructure?.transmutationMode);
      const remarks = termGrade === null ? null : getRemarks(termGrade);
      const description = termGrade === null ? "Template transmutation table unavailable" : (weights.templateStructure?.descriptorTable.find((row) => row.numericalGrade === termGrade)?.descriptor ?? "");
      const previewGrade = initialGrade ?? 0;
      return { id: student.id, name: student.name, previewGrade, termGrade, remarks, description };
    });
  }, [roster, groups, scores, examinations, weights.templateStructure?.descriptorTable, weights.templateStructure?.transmutationTable, component, resolvedWeights, items, term]);

  const {grading:{submitGrades,fetchGradeSubmissionStatus}}=useTeacherAcademicServices();
  const [existingSubmission, setExistingSubmission] = useState<import('../services/subjectGrading.service').GradeSubmissionStatus | null>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(false);
  const submissionResource = subjectSectionId + ':' + term;
  const currentSubmissionResource = useRef(submissionResource);
  useEffect(() => { currentSubmissionResource.current = submissionResource; setCheckingSubmission(false); return () => { currentSubmissionResource.current = ''; }; }, [submissionResource]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rulesReady = useRef(gradingRulesVerified); rulesReady.current = gradingRulesVerified;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { showToast } = useToast();
  const setSnackbar = (message: { type: "error" | "success"; message: string }) => showToast(message.message, message.type);



  async function handleSubmitClick() {
    if (!rulesReady.current || isSubmitting || checkingSubmission) return;
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
    setCheckingSubmission(true);
    try {
      const status = await fetchGradeSubmissionStatus(subjectSectionId, term);
      if (!rulesReady.current || currentSubmissionResource.current !== submissionResource) return;
      setExistingSubmission(status);
      setShowConfirmModal(true);
    } catch (error) {
      if (currentSubmissionResource.current === submissionResource) setSnackbar({ type: 'error', message: error instanceof Error ? error.message : 'Could not check submission status. Please try again.' });
    } finally {
      if (currentSubmissionResource.current === submissionResource) setCheckingSubmission(false);
    }
  }

  async function handleConfirmSubmit() {
    if (!rulesReady.current || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitGrades(subjectSectionId, term, undefined, existingSubmission?.submissionVersion ?? null);
      setShowConfirmModal(false);
      setJustSubmitted(true);
      setSnackbar({ type: "success", message: "Grades submitted to the adviser's gradesheet." });
      window.setTimeout(() => setJustSubmitted(false), 3000);
    } catch (err) {
      console.error("Failed to submit grades:", err);
      const message = err instanceof Error ? err.message : "Failed to submit grades. Please try again.";
      setSubmitError(message);
      setSnackbar({ type: "error", message });
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
  const columnCount = 2 + groups.reduce((sum, group) => sum + groupColumnSpan(group), 0) + 3;

  function renderStudentRow(student: GenderedStudent, index: number, pending: boolean) {
    const groupCells = groups.map((group) => {
      const result = computeGroupResult(group, student.id, scores, examinations);

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
              <td key={`ws-${component.key}`} className="qed-record-ws min-w-16 whitespace-nowrap px-2 py-2.5 text-center text-xs font-bold tabular-nums">{ws === null ? "—" : ws.toFixed(2)}</td>
            ))}
            {group.examOutputs?.percentageScore && <td className="min-w-16 whitespace-nowrap px-2 py-2.5 text-center text-xs font-bold tabular-nums">{result.ps === null ? "—" : result.ps.toFixed(2)}</td>}
            {group.examOutputs?.weightedScore && <td className="qed-record-ws min-w-16 whitespace-nowrap px-2 py-2.5 text-center text-xs font-bold tabular-nums">{result.ws === null ? "—" : result.ws.toFixed(2)}</td>}
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
                <td className="qed-record-ws px-2 py-2.5 text-center text-xs font-bold tabular-nums">
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
              <td className="qed-record-ws px-2 py-2.5 text-center text-xs font-bold tabular-nums">
                {result.ws !== null ? result.ws.toFixed(2) : "—"}
              </td>
            </>
          )}
        </Fragment>
      );
    });

    const { initialGrade } = computeStudentGrade(student, groups, scores, examinations);
    const termGrade = computeTransmutedGrade(initialGrade, weights.templateStructure?.transmutationTable, weights.templateStructure?.transmutationMode);
    const descriptor = termGrade === null
      ? null
      : weights.templateStructure?.descriptorTable.find((row) => row.numericalGrade === termGrade)?.descriptor ?? null;

    return (
      <tr key={student.id} data-sk-region="subject-record-student" className={`qed-record-row border-t ${panelBorder} ${index % 2 ? (darkMode ? "bg-white/1.5" : "bg-black/[0.012]") : ""}`}>
        <td data-learner-number className={`sticky left-0 z-20 w-16 min-w-16 max-w-16 border-r px-4 py-2.5 text-xs tabular-nums ${darkMode ? "bg-panel-dark" : index % 2 ? "bg-[#FCFCFD]" : "bg-white"} ${panelBorder} ${textPrimary}`}>{index + 1}</td>
        <td data-learner-name className={`sticky left-16 z-20 min-w-60 border-r px-4 py-2.5 text-sm font-bold shadow-[2px_0_4px_rgba(15,23,42,0.05)] ${darkMode ? "bg-panel-dark" : index % 2 ? "bg-[#FCFCFD]" : "bg-white"} ${panelBorder} ${textPrimary}`}>
          {pending && !roster.length ? <SkeletonText width={index % 2 ? "13ch" : "17ch"} /> : student.name}
        </td>
        {pending ? maskCells(groupCells) : groupCells}
        <td className="px-3 py-2.5 text-center text-sm font-black tabular-nums" style={{ color: "var(--brand-ink)" }}>
          {pending ? <SkeletonText width="5ch" className="mx-auto" /> : initialGrade !== null ? initialGrade.toFixed(2) : "—"}
        </td>
        <td className="px-3 py-2.5 text-center text-sm font-black tabular-nums" style={{ color: "var(--brand-ink)" }}>
          {pending ? <SkeletonText width="3ch" className="mx-auto" /> : termGrade ?? "—"}
        </td>
        <td className="px-3 py-2.5 text-center text-sm font-semibold">
          {pending ? <SkeletonText width="12ch" className="mx-auto" /> : descriptor ?? "—"}
        </td>
      </tr>
    );
  }

  const columnWidths = useColumnReservation(view, [
    { label: "No.", typical: "99", reservedWidth: 64 },
    { label: "Learners' Names", typical: "Maria Alexandra Delos Santos", reservedWidth: 240 },
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
  function renderRecordsTable(pending: boolean) {
    const placeholderRoster: GenderedStudent[] = pending && !roster.length
      ? Array.from({ length: skeletonRows(view, undefined, 40) }, (_, index) => ({ id: `pending-${index}`, name: '', gender: index % 2 ? 'F' : 'M' })) : [];
    const visibleGroups = placeholderRoster.length ? { male: placeholderRoster.filter(student => student.gender === 'M'), female: placeholderRoster.filter(student => student.gender === 'F') } : grouped;
    return (<div className="overflow-x-auto" data-record-scroll="horizontal">
        <table className="qed-assessment-table teacher-user-table w-full min-w-max border-collapse text-xs">
          {pending && <colgroup>{columnWidths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>}
          <thead className={`sticky top-0 z-30 ${darkMode ? "bg-[#241311]" : "bg-white"}`}>
            <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
              <th rowSpan={3} className={`sticky left-0 z-50 w-16 min-w-16 max-w-16 border px-3 py-3 text-left ${darkMode ? "bg-panel-dark" : "bg-brand-light"} ${panelBorder} ${textPrimary}`}>No.</th>
              <th rowSpan={3} className={`sticky left-16 z-50 w-60 min-w-60 border px-3 py-3 text-left text-sm font-black uppercase shadow-[2px_0_5px_rgba(15,23,42,0.08)] ${darkMode ? "bg-panel-dark" : "bg-brand-light"} ${panelBorder} ${textPrimary}`}>
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
            <tr className="qed-record-hps">
              <th colSpan={2} className={`sticky left-0 z-50 min-w-60 border-r px-3 py-2 text-left text-xs font-black uppercase shadow-[2px_0_5px_rgba(15,23,42,0.08)] ${darkMode ? "bg-panel-dark" : "bg-white"} ${panelBorder} ${textMuted}`}>HPS</th>
              {pending ? maskCells(hpsCells) : hpsCells}
              <th className={`min-w-24 border px-2 py-2 ${panelBorder}`} aria-label="No HPS for Initial Grade" />
              <th className={`min-w-24 border px-2 py-2 ${panelBorder}`} aria-label="No HPS for Term Grade" />
              <th className={`min-w-32 border px-2 py-2 ${panelBorder}`} aria-label="No HPS for Descriptor" />
            </tr>
          </thead>
          <tbody>
            {visibleGroups.male.length > 0 && (
              <>
                <tr className="qed-record-group">
                  <td colSpan={2} className={`sticky left-0 z-20 min-w-60 border-r px-3 py-2 text-left text-xs font-black uppercase shadow-[2px_0_5px_rgba(15,23,42,0.05)] ${panelBorder} ${darkMode ? "bg-[#34201D]" : "bg-brand-light"} ${textPrimary}`}>Male</td>
                  <td colSpan={columnCount - 2} className={`border px-3 py-2 ${panelBorder} ${darkMode ? "bg-white/10" : "bg-brand-light"}`} />
                </tr>
                {visibleGroups.male.map((student, index) => renderStudentRow(student, index, pending))}
              </>
            )}
            {visibleGroups.female.length > 0 && (
              <>
                <tr className="qed-record-group">
                  <td colSpan={2} className={`sticky left-0 z-20 min-w-60 border-r px-3 py-2 text-left text-xs font-black uppercase shadow-[2px_0_5px_rgba(15,23,42,0.05)] ${panelBorder} ${darkMode ? "bg-[#34201D]" : "bg-brand-light"} ${textPrimary}`}>Female</td>
                  <td colSpan={columnCount - 2} className={`border px-3 py-2 ${panelBorder} ${darkMode ? "bg-white/10" : "bg-brand-light"}`} />
                </tr>
                {visibleGroups.female.map((student, index) => renderStudentRow(student, index, pending))}
              </>
            )}
            {!pending && roster.length === 0 && (
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
    <section ref={recordSection} className={`qed-assessment-records ${cardClasses}`} aria-label={title}>
      {component && <div className={`space-y-2 border-b p-4 ${panelBorder} ${textPrimary}`}>
        <label className="flex items-center gap-3 text-sm font-semibold">MAPEH component
          <select aria-label="MAPEH component" disabled={isEditing} value={component.id} onChange={e=>setSelectedComponentId(e.target.value)} className={`rounded-lg border p-2 ${panelBg} ${panelBorder}`}>
            {resolvedWeights?.templateStructure?.components?.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <p className={`text-xs ${textMuted}`}>The table shows {component.label} grades. Submission and Final Grades use the rounded average of both component grades. Both components must be complete before submission.</p>
      </div>}
      <ClassRecordExportModal state={exportState} darkMode={darkMode} onClose={() => setExportState("idle")} />
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${panelBorder}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`qed-type-card-title font-semibold ${textPrimary}`}>Assessment records</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold qed-record-count`}>
            {loading && !roster.length ? <SkeletonText width="10ch" /> : <>{roster.length} student{roster.length === 1 ? '' : 's'}</>}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-label="Export DepEd Class Record" title="Export all terms using the official DepEd template" onClick={() => void exportClassRecord()} disabled={loading || exportState === "loading"} className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-colors disabled:opacity-50 ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/[0.035]'} ${panelBorder} ${textPrimary}`}>
            <Download size={14} /> Export Class Record
          </button>
          {toolbarAction}
        </div>
      </div>
      {groups.some((group) => (group.capacityOverflow ?? 0) > 0) && (
        <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
          {groups.filter((group) => (group.capacityOverflow ?? 0) > 0)
            .map((group) => `${group.label}: ${group.capacityOverflow} assessment${group.capacityOverflow === 1 ? "" : "s"} exceed the assigned template's mapped slots`)
            .join(". ")}. Export is blocked until an appropriately mapped template is assigned; no assessments are hidden.
        </div>
      )}
      <LoadingRegion name="subject-assessment-records" loading={loading} variable autoColumns skeleton={null} frame={renderRecordsTable} retainPrevious hasContent={!!resolvedWeights && roster.length > 0} onSettled={() => {
        // Outgoing and incoming frames coexist during the swap. Sharing one
        // table ref lets outgoing cleanup null it after incoming attachment.
        // Measure the settled live table through the stable section instead.
        rememberColumns(view, recordSection.current?.querySelector<HTMLTableElement>('[data-sk-region="subject-assessment-records"] [data-sk-content] table') ?? null);
        rememberRows(view, roster.length);
      }}>{null}</LoadingRegion>
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
            disabled={isSubmitting || checkingSubmission || loading}
            title={isSubmitting ? "Submitting…" : "Submit Grades"}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-maroon px-4 text-xs font-bold uppercase tracking-wide text-white shadow-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
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
                  {existingSubmission?.submitted && <span className="mt-2 block">A submission is already recorded{existingSubmission.submittedAt ? ` (${new Date(existingSubmission.submittedAt).toLocaleString()})` : ''}. Confirming again creates a new submission history entry.</span>}
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
          disabled={isSubmitting || !gradingRulesVerified}
          size="lg"
          panelClassName={`max-h-[85vh] rounded-2xl shadow-xl ${panelBorder} ${darkMode ? "bg-panel-dark" : "bg-white"}`}
          titleClassName={`uppercase ${textPrimary}`}
          descriptionClassName={textMuted}
          bodyClassName="space-y-3 px-5 pb-4 pt-0"
          footerClassName={`border-t px-5 py-4 ${panelBorder}`}
          cancelButtonClassName={`h-9 rounded-lg uppercase tracking-wide ${panelBorder} ${textPrimary}`}
          confirmButtonClassName="h-9 rounded-lg bg-maroon uppercase tracking-wide shadow-primary"
          confirmLeading={<Send className="h-3.5 w-3.5" />}
        >
          <>
              <table className="teacher-user-table w-full text-xs">
                <thead>
                  <tr className={`border-b ${panelBorder} ${textMuted}`}>
                    <th className="py-2 text-left font-black uppercase">Student</th>
                    <th className="py-2 text-center font-black uppercase">{component ? 'Selected component IG' : 'Initial Grade'}</th>
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


    </section>
  );
}

