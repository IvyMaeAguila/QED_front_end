import { Fragment, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Send, X } from "lucide-react";
import ExcelJS from "exceljs";
import type { RosterStudent } from "./data";
import {
  formatShortDate,
  type ExamType,
  type GradeItem,
  type ScoreMap,
} from "./types/Grading";
import {
  computeInitialGrade,
  computePS,
  computeWS,
  computeExamPS,
  computeTransmutedGrade,
  type ExamSubWeights,
} from "./utils/GradeWeights";
import { submitGrades } from "../services/subjectGrading.service";
import { downloadActiveGradeTemplate } from "../services/subjectGradeTemplate.service";
import type { GradeTemplateStructure, TemplateDomain } from "../../../../shared/grading/gradeTemplate.types";

const ACCENT = "#6B0000";
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
  weights: { ww: number; pt: number; exam: number; examSubWeights?: ExamSubWeights; templateStructure?: GradeTemplateStructure };
  term: string;
  termNumber?: number;
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

// Single source of truth for turning a group's items + scores into a
// PS/WS pair. Branches only for "exams" when examSubWeights is supplied —
// WW and PT always take the pooled path, and exams take the pooled path
// too when no template is active for this subject.
function computeGroupResult(
  group: ComponentColumnGroup,
  studentId: string,
  scores: ScoreMap,
  examSubWeights: ExamSubWeights | undefined,
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

  if (group.key !== "exams" || !examSubWeights) {
    const ps = computePS(pooled.total, pooled.highestPossible);
    const ws = computeWS(ps, group.weight);
    return {
      total: pooled.total,
      ps,
      ws,
      hasAnyItems: pooled.totalItems > 0,
      isComplete: pooled.totalItems === 0 || pooled.isComplete,
    };
  }

  // Sub-weighted path: ST1/ST2/TE computed and combined separately rather
  // than pooled together.
  const types: ExamType[] = ["ST1", "ST2", "TE"];
  const perType = types.map((t) => ({
    type: t,
    totals: studentTotals(group.items.filter((i) => i.examType === t), studentId, scores),
  }));

  const hasAnyItems = perType.some((p) => p.totals.totalItems > 0);
  const allTypesPresent = perType.every((p) => p.totals.totalItems > 0);
  const isComplete = hasAnyItems && allTypesPresent && perType.every((p) => p.totals.isComplete);

  if (!allTypesPresent) {
    // Can't produce a valid combined PS until ST1, ST2, and TE all have at
    // least one item recorded for this term.
    return { total: pooled.total, ps: null, ws: null, hasAnyItems, isComplete: false };
  }

  const totalsByType: Partial<Record<ExamType, { total: number; highestPossible: number }>> = {};
  perType.forEach((p) => {
    totalsByType[p.type] = { total: p.totals.total, highestPossible: p.totals.highestPossible };
  });

  const ps = computeExamPS(totalsByType, examSubWeights);
  const ws = computeWS(ps, group.weight);

  return { total: pooled.total, ps, ws, hasAnyItems, isComplete };
}

function columnLabel(item: GradeItem, groupKey: ComponentColumnGroup["key"]) {
  return groupKey === "exams" ? (item.examType as ExamType) : formatShortDate(item.date);
}

function excelColumnLetter(columnNumber: number): string {
  let column = columnNumber;
  let label = "";
  while (column > 0) {
    const remainder = (column - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    column = Math.floor((column - 1) / 26);
  }
  return label;
}

async function downloadTemplateGradeRecord(args: {
  subjectSectionId: string;
  title: string;
  termNumber: number;
  roster: GenderedStudent[];
  items: GradeItem[];
  scores: ScoreMap;
  groups: ComponentColumnGroup[];
  weights: AssessmentRecordsSectionProps["weights"];
}) {
  const structure = args.weights.templateStructure;
  const layout = structure?.layout;
  if (!structure || !layout) throw new Error("Upload the official grade template for this subject before exporting.");

  const templateBuffer = await downloadActiveGradeTemplate(args.subjectSectionId);
  const templateWorkbook = new ExcelJS.Workbook();
  await templateWorkbook.xlsx.load(templateBuffer);
  const source = templateWorkbook.getWorksheet(`TERM ${args.termNumber}`);
  if (!source) throw new Error(`The uploaded template does not contain TERM ${args.termNumber}.`);

  const overflowPlans: { key: string; originalAt: number; count: number }[] = [];
  for (const group of args.groups.filter((entry) => entry.key !== "exams")) {
    for (const domain of group.domains ?? []) {
      const domainItems = (group.domains?.length ?? 0) > 1
        ? group.items.filter((item) => item.templateDomainId === domain.id)
        : group.items;
      const scoreColumns = domain.scoreColumns ?? [];
      const extraCount = Math.max(0, domainItems.length - scoreColumns.length);
      if (!extraCount) continue;
      if (!scoreColumns.length) throw new Error(`${domain.label || group.label} has no score slots in the uploaded template.`);
      overflowPlans.push({ key: `${group.key}:${domain.id}`, originalAt: Math.max(...scoreColumns) + 1, count: extraCount });
    }
  }
  overflowPlans.sort((a, b) => a.originalAt - b.originalAt);
  const originalInsertions = overflowPlans.flatMap((plan) => Array.from({ length: plan.count }, () => plan.originalAt));
  const inserted = originalInsertions.map((originalAt, index) => ({ originalAt, actualAt: originalAt + index }));
  const shiftedColumn = (column: number) => column + inserted.filter((entry) => entry.originalAt <= column).length;
  const overflowByDomain = new Map<string, number[]>();
  let insertedOffset = 0;
  for (const plan of overflowPlans) {
    overflowByDomain.set(plan.key, inserted.slice(insertedOffset, insertedOffset + plan.count).map((entry) => entry.actualAt));
    insertedOffset += plan.count;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "QED System";
  const worksheet = workbook.addWorksheet(source.name);
  const rowCount = Math.max(source.rowCount, ...layout.studentRows.map((entry) => entry.row));
  for (let column = 1; column <= source.columnCount; column += 1) {
    const from = source.getColumn(column);
    const to = worksheet.getColumn(shiftedColumn(column));
    to.width = from.width;
    to.hidden = from.hidden;
  }
  for (let rowNumber = 1; rowNumber <= rowCount; rowNumber += 1) {
    const fromRow = source.getRow(rowNumber);
    const toRow = worksheet.getRow(rowNumber);
    toRow.height = fromRow.height;
    toRow.hidden = fromRow.hidden;
    for (let column = 1; column <= source.columnCount; column += 1) {
      const from = fromRow.getCell(column);
      const to = toRow.getCell(shiftedColumn(column));
      if (Object.keys(from.style).length > 0) to.style = JSON.parse(JSON.stringify(from.style)) as Partial<ExcelJS.Style>;
      // Template formulas often link to INPUT DATA or HELPER sheets. This
      // export intentionally includes only the selected term's class record.
      if (typeof from.value === "string" || typeof from.value === "number" || from.value instanceof Date) {
        to.value = from.value instanceof Date ? new Date(from.value.getTime()) : from.value;
      }
    }
  }
  for (const { actualAt } of inserted) {
    worksheet.getColumn(actualAt).width = worksheet.getColumn(Math.max(1, actualAt - 1)).width;
    for (let rowNumber = 1; rowNumber <= rowCount; rowNumber += 1) {
      const from = worksheet.getCell(rowNumber, Math.max(1, actualAt - 1));
      const to = worksheet.getCell(rowNumber, actualAt);
      if (Object.keys(from.style).length > 0) to.style = JSON.parse(JSON.stringify(from.style)) as Partial<ExcelJS.Style>;
    }
  }
  for (const range of source.model.merges) {
    const [first, last] = range.split(":");
    const start = source.getCell(first);
    const end = source.getCell(last ?? first);
    worksheet.mergeCells(
      `${excelColumnLetter(shiftedColumn(start.fullAddress.col))}${start.fullAddress.row}:${excelColumnLetter(shiftedColumn(end.fullAddress.col))}${end.fullAddress.row}`,
    );
  }

  const maleRows = layout.studentRows.filter((entry) => entry.gender === "M");
  const femaleRows = layout.studentRows.filter((entry) => entry.gender === "F");
  const maleStudents = args.roster.filter((student) => student.gender !== "F");
  const femaleStudents = args.roster.filter((student) => student.gender === "F");
  if (maleStudents.length > maleRows.length || femaleStudents.length > femaleRows.length) {
    throw new Error("The uploaded template does not have enough learner rows for this class.");
  }
  const studentRows = new Map<string, number>();
  maleStudents.forEach((student, index) => studentRows.set(student.id, maleRows[index].row));
  femaleStudents.forEach((student, index) => studentRows.set(student.id, femaleRows[index].row));
  for (const student of args.roster) worksheet.getCell(studentRows.get(student.id)!, layout.nameColumn).value = student.name;
  worksheet.getCell("AA10").value = args.title;

  const weightedScoreColumns: number[] = [];
  const allWrittenAndPerformanceColumns: number[] = [];
  const formulaRange = (columns: number[], row: number) => columns.map((column) => `${excelColumnLetter(column)}${row}`);
  const scoreHeaderRow = layout.scoreHeaderRow;
  const hpsRow = layout.highestPossibleRow;

  for (const group of args.groups.filter((entry) => entry.key !== "exams")) {
    for (const domain of group.domains ?? []) {
      const domainItems = (group.domains?.length ?? 0) > 1
        ? group.items.filter((item) => item.templateDomainId === domain.id)
        : group.items;
      const baseColumns = (domain.scoreColumns ?? []).map(shiftedColumn);
      const overflowColumns = overflowByDomain.get(`${group.key}:${domain.id}`) ?? [];
      const columns = [...baseColumns, ...overflowColumns].slice(0, domainItems.length);
      columns.forEach((column, index) => {
        const item = domainItems[index];
        worksheet.getCell(scoreHeaderRow, column).value = index + 1;
        worksheet.getCell(hpsRow, column).value = item?.maxItems ?? null;
        allWrittenAndPerformanceColumns.push(column);
        for (const student of args.roster) {
          const row = studentRows.get(student.id)!;
          worksheet.getCell(row, column).value = item ? (args.scores[student.id]?.[item.id] ?? null) : null;
        }
      });
      for (const unusedColumn of [...baseColumns, ...overflowColumns].slice(domainItems.length)) {
        worksheet.getCell(hpsRow, unusedColumn).value = null;
        for (const student of args.roster) worksheet.getCell(studentRows.get(student.id)!, unusedColumn).value = null;
      }
      if (!columns.length) continue;

      const totalColumn = Math.max(...columns) + 1;
      const psColumn = totalColumn + 1;
      const wsColumn = totalColumn + 2;
      const totalLetter = excelColumnLetter(totalColumn);
      const psLetter = excelColumnLetter(psColumn);
      const wsLetter = excelColumnLetter(wsColumn);
      const hpsRefs = formulaRange(columns, hpsRow).join(",");
      worksheet.getCell(hpsRow, totalColumn).value = { formula: `IF(COUNT(${hpsRefs})=0,"",SUM(${hpsRefs}))` };
      worksheet.getCell(hpsRow, psColumn).value = 100;
      worksheet.getCell(hpsRow, wsColumn).value = domain.weightPercent / 100;
      for (const student of args.roster) {
        const row = studentRows.get(student.id)!;
        const refs = formulaRange(columns, row).join(",");
        worksheet.getCell(row, totalColumn).value = { formula: `IF(COUNT(${refs})=0,"",SUM(${refs}))` };
        worksheet.getCell(row, psColumn).value = { formula: `IF(${totalLetter}${row}="","",IFERROR(${totalLetter}${row}/${totalLetter}$${hpsRow}*${psLetter}$${hpsRow},""))` };
        worksheet.getCell(row, wsColumn).value = { formula: `IF(${psLetter}${row}="","",${psLetter}${row}*${wsLetter}$${hpsRow})` };
      }
      weightedScoreColumns.push(wsColumn);
    }
  }

  const examColumnByType = {
    ST1: shiftedColumn(layout.examScoreColumns.ST1),
    ST2: shiftedColumn(layout.examScoreColumns.ST2),
    TE: shiftedColumn(layout.examScoreColumns.TE),
  };
  const examWsColumns = layout.examWeightedScoreColumns
    ? [layout.examWeightedScoreColumns.ST1, layout.examWeightedScoreColumns.ST2, layout.examWeightedScoreColumns.TE].map(shiftedColumn)
    : [layout.examScoreColumns.ST1 + 3, layout.examScoreColumns.ST2 + 3, layout.examScoreColumns.TE + 3].map(shiftedColumn);
  const examItems = args.groups.find((group) => group.key === "exams")?.items ?? [];
  for (const type of ["ST1", "ST2", "TE"] as const) {
    const typedItems = examItems.filter((item) => item.examType === type);
    const scoreColumn = examColumnByType[type];
    worksheet.getCell(hpsRow, scoreColumn).value = typedItems.length ? typedItems.reduce((sum, item) => sum + item.maxItems, 0) : null;
    worksheet.getCell(hpsRow, examWsColumns[["ST1", "ST2", "TE"].indexOf(type)]).value =
      structure.examSubWeights[type === "ST1" ? "st1" : type === "ST2" ? "st2" : "te"];
    for (const student of args.roster) {
      const row = studentRows.get(student.id)!;
      const values = typedItems.map((item) => args.scores[student.id]?.[item.id]).filter((value): value is number => typeof value === "number");
      worksheet.getCell(row, scoreColumn).value = values.length ? values.reduce((sum, value) => sum + value, 0) : null;
      const subweightColumn = examWsColumns[["ST1", "ST2", "TE"].indexOf(type)];
      const scoreLetter = excelColumnLetter(scoreColumn);
      const subweightLetter = excelColumnLetter(subweightColumn);
      worksheet.getCell(row, subweightColumn).value = {
        formula: `IF(${scoreLetter}${row}="","",IFERROR(${scoreLetter}${row}/${scoreLetter}$${hpsRow}*${subweightLetter}$${hpsRow},""))`,
      };
    }
  }
  const examPsColumn = shiftedColumn(layout.examPsColumn ?? layout.examScoreColumns.TE + 4);
  const examWsColumn = shiftedColumn(layout.examWeightedScoreColumn ?? layout.examScoreColumns.TE + 5);
  const examWeightRowCell = worksheet.getCell(hpsRow, examWsColumn);
  examWeightRowCell.value = args.weights.exam / 100;
  for (const student of args.roster) {
    const row = studentRows.get(student.id)!;
    const rawExamRefs = Object.values(examColumnByType).map((column) => `${excelColumnLetter(column)}${row}`);
    const weightedExamRefs = examWsColumns.map((column) => `${excelColumnLetter(column)}${row}`);
    const rawCount = rawExamRefs.join(",");
    const weightedSum = weightedExamRefs.join(",");
    worksheet.getCell(row, examPsColumn).value = {
      formula: `IF(COUNT(${rawCount})=0,"",SUM(${weightedSum}))`,
    };
    worksheet.getCell(row, examWsColumn).value = {
      formula: `IF(${excelColumnLetter(examPsColumn)}${row}="","",${excelColumnLetter(examPsColumn)}${row}*${excelColumnLetter(examWsColumn)}$${hpsRow})`,
    };
  }
  worksheet.getCell(hpsRow, examPsColumn).value = 100;
  worksheet.getCell(hpsRow, examPsColumn).numFmt = "0";
  weightedScoreColumns.push(examWsColumn);

  const initialGradeColumn = shiftedColumn(layout.finalColumns.initialGrade);
  const termGradeColumn = shiftedColumn(layout.finalColumns.termGrade);
  const descriptorColumn = shiftedColumn(layout.finalColumns.descriptor);
  const minRows = [...structure.transmutationTable].sort((a, b) => a.igMin - b.igMin);
  const descriptorRows = [...structure.descriptorTable].sort((a, b) => a.numericalGrade - b.numericalGrade)
    .filter((entry, index, list) => index === 0 || entry.descriptor !== list[index - 1].descriptor);
  const minArray = `{${minRows.map((entry) => entry.igMin).join(",")}}`;
  const gradeArray = `{${minRows.map((entry) => entry.transmuted).join(",")}}`;
  const descriptorMinArray = `{${descriptorRows.map((entry) => entry.numericalGrade).join(",")}}`;
  const descriptorArray = `{${descriptorRows.map((entry) => `"${entry.descriptor.replace(/"/g, '""')}"`).join(",")}}`;
  for (const student of args.roster) {
    const row = studentRows.get(student.id)!;
    const scoreRefs = [...allWrittenAndPerformanceColumns, ...Object.values(examColumnByType)].map((column) => `${excelColumnLetter(column)}${row}`);
    const wsRefs = weightedScoreColumns.map((column) => `${excelColumnLetter(column)}${row}`);
    const initialLetter = excelColumnLetter(initialGradeColumn);
    const termLetter = excelColumnLetter(termGradeColumn);
    worksheet.getCell(row, initialGradeColumn).value = {
      formula: `IF(COUNT(${scoreRefs.join(",")})=0,"",SUM(${wsRefs.join(",")}))`,
    };
    worksheet.getCell(row, termGradeColumn).value = {
      formula: `IF(${initialLetter}${row}="","",LOOKUP(${initialLetter}${row},${minArray},${gradeArray}))`,
    };
    worksheet.getCell(row, descriptorColumn).value = {
      formula: `IF(${termLetter}${row}="","",LOOKUP(${termLetter}${row},${descriptorMinArray},${descriptorArray}))`,
    };
  }

  workbook.calcProperties.fullCalcOnLoad = true;
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${args.title.replace(/[^a-z0-9_-]+/gi, "-")}-TERM-${args.termNumber}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function makeGroupColumns(
  key: ComponentColumnGroup["key"],
  items: GradeItem[],
  domains: TemplateDomain[] | undefined,
  hasTemplate: boolean,
): { columns: ScoreColumn[]; domainGroups?: DomainColumnGroup[] } {
  if (key === "exams") {
    if (hasTemplate) {
      const columns = (["ST1", "ST2", "TE"] as const).flatMap((examType) => {
        const examItems = items.filter((item) => item.examType === examType);
        return examItems.length > 0
          ? examItems.map((item) => ({ id: item.id, item, label: examType }))
          : [{ id: `template-${examType}`, label: examType }];
      });
      return { columns };
    }
    if (items.length > 0) {
      return { columns: items.map((item) => ({ id: item.id, item, label: columnLabel(item, key) })) };
    }
    return { columns: [] };
  }

  // Without template domains, keep the existing component-level Total/PS/WS
  // layout. Only split the table into per-domain summaries when the uploaded
  // template actually defines those domains.
  if (!domains?.length) {
    return {
      columns: items.map((item) => ({
        id: item.id,
        item,
        label: columnLabel(item, key),
        maxItems: item.maxItems,
      })),
    };
  }

  const domainGroups: DomainColumnGroup[] = [];
  const columns: ScoreColumn[] = [];
  const assignedItems = new Set<string>();
  for (const domain of domains ?? []) {
    const domainItems = items.filter((item) =>
      (domains?.length ?? 0) > 1 ? item.templateDomainId === domain.id : true,
    );
    domainItems.forEach((item) => assignedItems.add(item.id));
    const slotCount = domain.scoreColumns?.length ?? 0;
    const count = Math.max(slotCount, domainItems.length);
    const domainColumns: ScoreColumn[] = [];
    for (let index = 0; index < count; index += 1) {
      const item = domainItems[index];
      domainColumns.push({
        id: item?.id ?? `template-${domain.id}-${index}`,
        item,
        label: item ? columnLabel(item, key) : String(index + 1),
        maxItems: item?.maxItems,
      });
    }
    domainGroups.push({
      id: domain.id,
      label: domain.label || "Assessment Items",
      weightPercent: domain.weightPercent,
      items: domainItems,
      columns: domainColumns,
    });
    columns.push(...domainColumns);
  }

  // Preserve items that have no matching domain (for example, an item
  // created before a template was uploaded) instead of hiding their scores.
  for (const item of items) {
    if (!assignedItems.has(item.id)) {
      const column = { id: item.id, item, label: columnLabel(item, key), maxItems: item.maxItems };
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
  return { columns, domainGroups: domainGroups.length > 0 ? domainGroups : undefined };
}

function computeStudentGrade(
  student: GenderedStudent,
  groups: ComponentColumnGroup[],
  scores: ScoreMap,
  examSubWeights: ExamSubWeights | undefined,
): { initialGrade: number | null; anyGroupIncomplete: boolean } {
  const weightedScores: number[] = [];
  let anyGroupIncomplete = false;

  groups.forEach((group) => {
    const result = computeGroupResult(group, student.id, scores, examSubWeights);
    if (result.hasAnyItems && !result.isComplete) anyGroupIncomplete = true;
    if (result.ws !== null) weightedScores.push(result.ws);
  });

  const initialGrade = computeInitialGrade(
    weightedScores[0] ?? null,
    weightedScores[1] ?? null,
    weightedScores[2] ?? null,
  );

  return { initialGrade, anyGroupIncomplete };
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
  weights,
  term,
  termNumber = 1,
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

  const examSubWeights = weights.examSubWeights;

  async function exportClassRecord() {
    try {
      await downloadTemplateGradeRecord({ subjectSectionId, title, termNumber, roster, items, scores, groups, weights });
    } catch (err) {
      setSnackbar({ type: "error", message: err instanceof Error ? err.message : "Excel export failed." });
    }
  }
  const groups: ComponentColumnGroup[] = useMemo(() => {
    const forTerm = (t: GradeItem["tab"]) =>
      items.filter((i) => i.tab === t && (!term || i.gradingPeriodId === term)).sort((a, b) => a.date.localeCompare(b.date));
    const hasTemplate = Boolean(weights.templateStructure);
    const wwItems = forTerm("writtenWorks");
    const ptItems = forTerm("performanceTask");
    const examItems = forTerm("exams");
    const wwDomains = weights.templateStructure?.ww.domains;
    const ptDomains = weights.templateStructure?.pt.domains;
    const wwLayout = makeGroupColumns("writtenWorks", wwItems, wwDomains, hasTemplate);
    const ptLayout = makeGroupColumns("performanceTask", ptItems, ptDomains, hasTemplate);
    const examLayout = makeGroupColumns("exams", examItems, undefined, hasTemplate);
    return [
      { key: "writtenWorks", label: "Written / Oral Works", weightLabel: `${weights.ww}%`, weight: weights.ww, items: wwItems, domains: wwDomains, ...wwLayout },
      { key: "performanceTask", label: "Product / Performance Tasks", weightLabel: `${weights.pt}%`, weight: weights.pt, items: ptItems, domains: ptDomains, ...ptLayout },
      { key: "exams", label: "Summative Tests and Term Examinations", weightLabel: `${weights.exam}%`, weight: weights.exam, items: examItems, ...examLayout },
    ];
  }, [items, term, weights]);

  const grouped = useMemo(() => {
    const male = roster.filter((s) => s.gender !== "F");
    const female = roster.filter((s) => s.gender === "F");
    return { male, female };
  }, [roster]);

  const isFullyGraded = useMemo(() => {
    if (roster.length === 0) return false;
    return roster.every((student) =>
      groups.every((group) => {
        const result = computeGroupResult(group, student.id, scores, examSubWeights);
        return !result.hasAnyItems || result.isComplete;
      }),
    );
  }, [roster, groups, scores, examSubWeights]);

  const incompleteReasons = useMemo(() => {
    const reasons: string[] = [];
    groups.forEach((group) => {
      if (group.items.length === 0) return;
      const anyMissing = roster.some((student) => {
        const result = computeGroupResult(group, student.id, scores, examSubWeights);
        return result.hasAnyItems && !result.isComplete;
      });
      if (anyMissing) reasons.push(group.label);
    });
    return reasons;
  }, [groups, roster, scores, examSubWeights]);

  const gradePreviews: StudentGradePreview[] = useMemo(() => {
    return roster.map((student) => {
      const { initialGrade } = computeStudentGrade(student, groups, scores, examSubWeights);
      const termGrade = computeTransmutedGrade(initialGrade, weights.templateStructure?.transmutationTable);
      const remarks = termGrade === null ? null : getRemarks(termGrade);
      const description = termGrade === null ? "Template transmutation table unavailable" : (weights.templateStructure?.descriptorTable.find((row) => row.numericalGrade === termGrade)?.descriptor ?? "");
      const previewGrade = initialGrade ?? 0;
      return { id: student.id, name: student.name, previewGrade, termGrade, remarks, description };
    });
  }, [roster, groups, scores, examSubWeights]);

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

  const columnCount = 1 + groups.reduce(
    (sum, group) => sum + group.columns.length + 3 * (group.domainGroups?.length || 1),
    0,
  ) + 3;

  function renderStudentRow(student: GenderedStudent, index: number) {
    const weightedScores: number[] = [];
    let anyGroupIncomplete = false;
    const missingIn: string[] = [];

    const groupCells = groups.map((group) => {
      const result = computeGroupResult(group, student.id, scores, examSubWeights);

      if (result.hasAnyItems && !result.isComplete) {
        anyGroupIncomplete = true;
        missingIn.push(group.label);
      }
      if (result.ws !== null) weightedScores.push(result.ws);

      return (
        <Fragment key={group.key}>
          {group.domainGroups?.length ? group.domainGroups.map((domain) => {
            const totals = studentTotals(domain.items, student.id, scores);
            const ps = computePS(totals.total, totals.highestPossible);
            const ws = computeWS(ps, domain.weightPercent);
            return (
              <Fragment key={domain.id}>
                {domain.columns.map((column) => (
                  <td key={column.id} className="px-2 py-2.5 text-center text-xs font-bold tabular-nums">
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
                <td className="px-2 py-2.5 text-center text-xs font-black tabular-nums" style={{ color: ACCENT }}>
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
                <td key={column.id} className="px-2 py-2.5 text-center text-xs font-bold tabular-nums">
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
              <td className="px-2 py-2.5 text-center text-xs font-black tabular-nums" style={{ color: ACCENT }}>
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

    const initialGrade = computeInitialGrade(
      weightedScores[0] ?? null,
      weightedScores[1] ?? null,
      weightedScores[2] ?? null,
    );
    const termGrade = computeTransmutedGrade(initialGrade, weights.templateStructure?.transmutationTable);
    const descriptor = termGrade === null
      ? null
      : weights.templateStructure?.descriptorTable.find((row) => row.numericalGrade === termGrade)?.descriptor ?? null;

    return (
      <tr key={student.id} className={`border-t ${panelBorder} ${index % 2 ? (darkMode ? "bg-white/1.5" : "bg-black/[0.012]") : ""}`}>
        <td className={`sticky left-0 z-10 px-4 py-2.5 text-sm font-bold ${darkMode ? "bg-[#111827]" : "bg-white"} ${textPrimary}`}>
          <span className="inline-flex items-center gap-1.5">
            {student.name}
            {anyGroupIncomplete && <MissingScoreDot missingIn={missingIn} />}
          </span>
        </td>
        {groupCells}
        <td className="px-3 py-2.5 text-center text-sm font-black tabular-nums" style={{ color: ACCENT }}>
          {initialGrade !== null ? initialGrade.toFixed(2) : "—"}
        </td>
        <td className="px-3 py-2.5 text-center text-sm font-black tabular-nums" style={{ color: ACCENT }}>
          {termGrade ?? "—"}
        </td>
        <td className="px-3 py-2.5 text-center text-sm font-semibold">
          {descriptor ?? "—"}
        </td>
      </tr>
    );
  }

  return (
    <section className={cardClasses} aria-label={title}>
      <div className={`flex items-center justify-between gap-3 border-b px-4 py-2 ${panelBorder}`}>
        <span className={`text-xs font-semibold ${textMuted}`}>Excel export includes recorded scores and current grade calculations.</span>
        <button type="button" onClick={() => void exportClassRecord()} className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold ${panelBorder} ${textPrimary}`}>
          <Download size={13} /> Export Excel
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-xs border-collapse">
          <thead>
            <tr className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
              <th
                rowSpan={4}
                className={`sticky left-0 z-10 min-w-52 border px-3 py-3 text-left text-sm font-black uppercase ${darkMode ? "bg-[#111827]" : "bg-white"} ${panelBorder} ${textPrimary}`}
              >
                Learners' Names
              </th>
              {groups.map((group) => (
                <th
                  key={group.key}
                  colSpan={group.columns.length + 3 * (group.domainGroups?.length || 1)}
                  className={`border px-2 py-3 text-center text-xs font-black uppercase ${panelBorder} ${textPrimary}`}
                >
                  {group.label} ({group.weightLabel})
                </th>
              ))}
              <th rowSpan={4} className={`border px-3 py-3 text-center text-xs font-black uppercase ${panelBorder} ${textPrimary}`}>
                Initial
                <br />
                Grade
              </th>
              <th rowSpan={4} className={`border px-3 py-3 text-center text-xs font-black uppercase ${panelBorder} ${textPrimary}`}>
                Term
                <br />
                Grade
              </th>
              <th rowSpan={4} className={`border px-3 py-3 text-center text-xs font-black uppercase ${panelBorder} ${textPrimary}`}>
                Descriptor
              </th>
            </tr>
            <tr className={darkMode ? "bg-white/3" : "bg-[#FAFBFC]"}>
              {groups.map((group) => (
                <Fragment key={group.key}>
                  {group.domainGroups?.length
                    ? group.domainGroups.map((domain) => (
                        <th
                          key={domain.id}
                          colSpan={domain.columns.length + 3}
                          className={`border px-2 py-2 text-center text-[10px] font-black uppercase ${panelBorder} ${textMuted}`}
                        >
                          {domain.label}
                          {(group.domainGroups?.length ?? 0) > 1 || Math.abs(domain.weightPercent - group.weight) > 0.01
                            ? ` (${domain.weightPercent}%)`
                            : ""}
                        </th>
                      ))
                    : <th colSpan={group.columns.length + 3} className={`border px-2 py-2 text-center text-[10px] font-black uppercase ${panelBorder} ${textMuted}`}>
                        {group.key === "exams" ? "Exam Components" : "Assessment Items"}
                      </th>}
                </Fragment>
              ))}
            </tr>
            <tr className={darkMode ? "bg-white/3" : "bg-[#FAFBFC]"}>
              {groups.map((group) => (
                <Fragment key={group.key}>
                  {group.domainGroups?.length
                    ? group.domainGroups.map((domain) => (
                        <Fragment key={domain.id}>
                          {domain.columns.map((column) => (
                            <th key={column.id} className={`border px-2 py-2 text-center font-bold ${panelBorder} ${textMuted}`}>
                              {column.label}
                            </th>
                          ))}
                          <th className={`border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`}>Total</th>
                          <th className={`border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`}>PS</th>
                          <th className={`border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`}>WS</th>
                        </Fragment>
                      ))
                    : <>
                        {group.columns.map((column) => (
                          <th key={column.id} className={`border px-2 py-2 text-center font-bold ${panelBorder} ${textMuted}`}>
                            {column.label}
                          </th>
                        ))}
                        <th className={`border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`}>Total</th>
                        <th className={`border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`}>PS</th>
                        <th className={`border px-2 py-2 text-center font-black ${panelBorder} ${textMuted}`}>WS</th>
                      </>}
                </Fragment>
              ))}
            </tr>
            <tr className={darkMode ? "bg-white/2" : "bg-white"}>
              {groups.map((group) => {
                return (
                  <Fragment key={group.key}>
                    {group.domainGroups?.length
                      ? group.domainGroups.map((domain) => {
                          const highest = domain.items.reduce((sum, item) => sum + item.maxItems, 0);
                          return (
                            <Fragment key={domain.id}>
                              {domain.columns.map((column) => (
                                <td key={column.id} className={`border px-2 py-2 text-center font-bold ${panelBorder} ${textMuted}`}>
                                  {column.maxItems ?? "—"}
                                </td>
                              ))}
                              <td className={`border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: ACCENT }}>{highest || "—"}</td>
                              <td className={`border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: ACCENT }}>100.00</td>
                              <td className={`border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: ACCENT }}>{domain.weightPercent}%</td>
                            </Fragment>
                          );
                        })
                      : (() => {
                          const highest = group.items.reduce((sum, item) => sum + item.maxItems, 0);
                          return <>
                            {group.columns.map((column) => (
                              <td key={column.id} className={`border px-2 py-2 text-center font-bold ${panelBorder} ${textMuted}`}>
                                {column.maxItems ?? "—"}
                              </td>
                            ))}
                            <td className={`border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: ACCENT }}>{highest || "—"}</td>
                            <td className={`border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: ACCENT }}>{(highest || weights.templateStructure) ? "100.00" : "—"}</td>
                            <td className={`border px-2 py-2 text-center font-black ${panelBorder}`} style={{ color: ACCENT }}>{(highest || weights.templateStructure) ? group.weightLabel : "—"}</td>
                          </>;
                        })()}
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
          {weights.templateStructure
            ? "The uploaded template columns are ready. Add assessment items from the subject assessment page to enable score entry for this term."
            : "No Written Works, Performance Task, or Exam items recorded yet for this term."}
        </p>
      )}

      {!isOwnAdvisory && (
        <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 ${panelBorder} ${darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}`}>
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
            disabled={isSubmitting}
            title={isSubmitting ? "Submitting…" : "Submit Grades"}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-maroon-gradient px-4 text-xs font-bold uppercase tracking-wide text-white shadow-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {isSubmitting ? "Submitting…" : "Submit Grades"}
          </button>
        </div>
      )}

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
                      <td className="py-2 text-center font-bold tabular-nums" style={{ color: ACCENT }}>
                        {preview.previewGrade.toFixed(2)}
                      </td>
                      <td className="py-2 text-center font-black tabular-nums" style={{ color: ACCENT }}>
                        {preview.termGrade ?? "—"}
                      </td>
                      <td className="py-2 text-center">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
                          style={{
                            backgroundColor: preview.remarks === "PASSED" ? "#DCFCE7" : preview.remarks === "FAILED" ? "#FEE2E2" : "#E5E7EB",
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
