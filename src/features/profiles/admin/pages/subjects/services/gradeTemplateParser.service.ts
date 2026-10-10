// services/gradeTemplateParser.service.ts
import type * as XLSX from "xlsx";
import type {
  ExamSubWeights,
  TemplateDomain,
  TemplateGroup,
  TransmutationRow,
  DescriptorRow,
  GradeTemplateStructure,
} from "../../../../shared/grading/gradeTemplate.types";
// ^ adjust this relative path to wherever admin's services folder actually
// sits relative to features/profiles/shared/grading/ — I'm guessing based
// on the depth seen in AdminLayout imports elsewhere; update if it doesn't resolve.

export type ParsedGradeTemplate = GradeTemplateStructure;

type CellGrid = Map<string, unknown>; // key: "row,col" (1-indexed)

function key(row: number, col: number): string {
  return `${row},${col}`;
}

function buildGrid(sheet: XLSX.WorkSheet, maxRow: number, maxCol: number, runtime: typeof XLSX): CellGrid {
  const grid: CellGrid = new Map();
  const range = runtime.utils.decode_range(sheet["!ref"] ?? "A1");
  const lastRow = Math.min(maxRow, range.e.r + 1);
  const lastCol = Math.min(maxCol, range.e.c + 1);
  for (let r = 1; r <= lastRow; r++) {
    for (let c = 1; c <= lastCol; c++) {
      const ref = runtime.utils.encode_cell({ r: r - 1, c: c - 1 });
      const cell = sheet[ref];
      if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
        grid.set(key(r, c), cell.v);
      }
    }
  }
  return grid;
}

function findText(grid: CellGrid, pattern: RegExp): [row: number, col: number] | null {
  for (const [k, v] of grid) {
    if (typeof v === "string" && pattern.test(v)) {
      const [r, c] = k.split(",").map(Number);
      return [r, c];
    }
  }
  return null;
}

function findExact(
  grid: CellGrid,
  text: string,
  row: number,
  colRange: [number, number],
): [row: number, col: number] | null {
  const target = text.trim().toLowerCase();
  for (let c = colRange[0]; c <= colRange[1]; c++) {
    const v = grid.get(key(row, c));
    if (typeof v === "string" && v.trim().toLowerCase() === target) {
      return [row, c];
    }
  }
  return null;
}

function domainLabelsInRange(
  grid: CellGrid,
  row: number,
  colRange: [number, number],
): { col: number; label: string }[] {
  const labels: { col: number; label: string }[] = [];
  for (let c = colRange[0]; c <= colRange[1]; c++) {
    const v = grid.get(key(row, c));
    if (typeof v === "string" && /domain\s*$/i.test(v.trim())) {
      labels.push({ col: c, label: v.trim() });
    }
  }
  return labels;
}

function slug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function readNumber(grid: CellGrid, row: number, col: number | undefined, label = "grading value"): number {
  if (col === undefined) throw new Error(`Could not locate ${label} in the uploaded template.`);
  const v = grid.get(key(row, col));
  const value = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v.trim()) : NaN;
  if (!Number.isFinite(value)) throw new Error(`${label} is missing or invalid in the uploaded template.`);
  return value;
}

function categoryWeight(grid: CellGrid, row: number, col: number | undefined, label: string): number {
  const raw = readNumber(grid, row, col, `${label} weight`);
  if (raw < 0 || raw > 1) throw new Error(`${label} weight must be a numeric percentage between 0 and 1 in the workbook.`);
  return Math.round(raw * 10000) / 100;
}

function scoreColumnsInRange(grid: CellGrid, row: number, start: number, end: number): number[] {
  const columns: number[] = [];
  for (let col = start; col <= end; col += 1) {
    const value = String(grid.get(key(row, col)) ?? "").trim();
    if (/^(total|ps|ws)$/i.test(value)) break;
    if (/^\d+$/.test(value)) columns.push(col);
  }
  return columns;
}

function parseGroup(
  grid: CellGrid,
  key_: "writtenWorks" | "performanceTask",
  colRange: [number, number],
  domainRow: number,
  columnHeaderRow: number,
  weightsRow: number,
): TemplateGroup {
  const labels = domainLabelsInRange(grid, domainRow, colRange);
  const domains: TemplateDomain[] = [];

  if (labels.length === 0) {
    const wsPos = findExact(grid, "WS", columnHeaderRow, colRange);
    const weight = categoryWeight(grid, weightsRow, wsPos?.[1], `${key_} domain`);
    domains.push({
      id: "default",
      label: "",
      weightPercent: Math.round(weight * 100 * 100) / 100,
      scoreColumns: scoreColumnsInRange(grid, columnHeaderRow, colRange[0], colRange[1]),
    });
  } else {
    labels.forEach((entry, i) => {
      const endCol = i + 1 < labels.length ? labels[i + 1].col - 1 : colRange[1];
      const block: [number, number] = [entry.col, endCol];
      const wsPos = findExact(grid, "WS", columnHeaderRow, block);
      const weight = categoryWeight(grid, weightsRow, wsPos?.[1], entry.label);
      domains.push({
        id: slug(entry.label),
        label: entry.label,
        weightPercent: Math.round(weight * 100 * 100) / 100,
        scoreColumns: scoreColumnsInRange(grid, columnHeaderRow, entry.col, endCol),
      });
    });
  }

  const weightPercent = Math.round(domains.reduce((s, d) => s + d.weightPercent, 0) * 100) / 100;
  return { key: key_, weightPercent, domains };
}

/**
 * Client-side preview only. Reads the official DepEd ECR .xlsx and derives
 * its actual structure — WW/PT weights AND whether they're split into
 * domains (e.g. GMRC's Cognitive/Affective/Behavioral) vs. flat
 * (Science/Math's plain item columns) — plus the Exam ST1/ST2/TE
 * sub-weights and the full transmutation + descriptor lookup tables from
 * the HELPER sheet. The backend must independently re-parse the same file
 * before persisting/trusting these numbers — this result is never
 * authoritative on its own.
 */
export function parseGradeTemplate(file: File): Promise<GradeTemplateStructure> {
  return file.arrayBuffer().then(async (buf) => {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buf, { type: "array" });

    const sheet = workbook.Sheets["TERM 1"];
    if (!sheet) {
      throw new Error(
        "Uploaded file has no 'TERM 1' sheet — is this the official DepEd ECR template?",
      );
    }
    const helperSheet = workbook.Sheets["HELPER"];
    if (!helperSheet) {
      throw new Error(
        "Uploaded file has no 'HELPER' sheet — is this the official DepEd ECR template?",
      );
    }

    const grid = buildGrid(sheet, 40, 60, XLSX);

    const wwPos = findText(grid, /WRITTEN.*ORAL WORKS/i);
    const ptPos = findText(grid, /PRODUCT.*PERFORMANCE/i);
    const exPos = findText(grid, /EXAMINATIONS/i);
    const igPos = findText(grid, /^Initial Grade$/i);
    const hpPos = findText(grid, /HIGHEST POSSIBLE SCORE/i);

    if (!wwPos || !ptPos || !igPos || !hpPos || (exPos && exPos[1] <= ptPos[1])) {
      throw new Error(
        "Could not locate the expected section headers (Written/Oral Works, Performance Tasks, " +
          "Initial Grade, Highest Possible Score) in 'TERM 1'. The file may not match " +
          "the official template layout.",
      );
    }

    const weightsRow = hpPos[0];
    const columnHeaderRow = weightsRow - 1;
    const domainRow = columnHeaderRow - 1;

    const wwRange: [number, number] = [wwPos[1], ptPos[1] - 1];
    const ptRange: [number, number] = [ptPos[1], (exPos?.[1] ?? igPos[1]) - 1];
    const exRange: [number, number] | null = exPos ? [exPos[1], igPos[1] - 1] : null;

    const ww = parseGroup(grid, "writtenWorks", wwRange, domainRow, columnHeaderRow, weightsRow);
    const pt = parseGroup(grid, "performanceTask", ptRange, domainRow, columnHeaderRow, weightsRow);

    const examinations = exRange
      ? parseExamConfiguration(grid, columnHeaderRow, weightsRow, exRange)
      : { enabled: false as const, categoryWeightPercent: 0, components: [], outputs: {} };
    const examWeightPercent = examinations.categoryWeightPercent;

    const weightSum = ww.weightPercent + pt.weightPercent + examWeightPercent;
    if (Math.abs(weightSum - 100) > 0.5) {
      throw new Error(`WW + PT${examinations.enabled ? " + Exam" : ""} weights read ${weightSum}%, expected 100%. Check the template.`);
    }

    const helperGrid = buildGrid(helperSheet, 60, 10, XLSX);
    const igMinPos = findText(helperGrid, /^IG \(Min\.\)$/i);
    const numGradePos = findText(helperGrid, /^Numerical Grade$/i);
    if (!igMinPos || !numGradePos) {
      throw new Error(
        "Could not locate the transmutation/descriptor tables in the 'HELPER' sheet. The file may " +
          "not match the official template layout.",
      );
    }

    const headerRow = igMinPos[0];
    const [, bCol] = igMinPos;
    const cCol = bCol + 1;
    const dCol = bCol + 2;
    const [, fCol] = numGradePos;
    const gCol = fCol + 1;

    const transmutationTable: TransmutationRow[] = [];
    for (let r = headerRow + 1; helperGrid.has(key(r, bCol)); r++) {
      transmutationTable.push({
        igMin: readNumber(helperGrid, r, bCol, "transmutation minimum"),
        igMax: readNumber(helperGrid, r, cCol, "transmutation maximum"),
        transmuted: readNumber(helperGrid, r, dCol, "transmuted grade"),
      });
    }

    const descriptorTable: DescriptorRow[] = [];
    for (let r = headerRow + 1; helperGrid.has(key(r, fCol)); r++) {
      const descriptor = helperGrid.get(key(r, gCol));
      descriptorTable.push({
        numericalGrade: readNumber(helperGrid, r, fCol, "descriptor grade"),
        descriptor: typeof descriptor === "string" ? descriptor : "",
      });
    }

    if (transmutationTable.length === 0 || descriptorTable.length === 0) {
      throw new Error("The 'HELPER' sheet's transmutation/descriptor tables appear to be empty.");
    }

    const standardExamKeys = new Set(examinations.components.map((component) => component.key.toUpperCase()));
    const examSubWeights: ExamSubWeights | undefined =
      standardExamKeys.has("ST1") && standardExamKeys.has("ST2") && standardExamKeys.has("TE")
        ? Object.fromEntries(examinations.components.map((component) => [component.key.toLowerCase(), component.weightPercent])) as unknown as ExamSubWeights
        : undefined;
    return { ww, pt, examWeightPercent, examinations, examSubWeights, transmutationTable, descriptorTable };
  });
}

function parseExamConfiguration(
  grid: CellGrid,
  headerRow: number,
  weightsRow: number,
  range: [number, number],
) {
  const rawLabels = ["ST1", "ST2", "TE"].filter((label) => findExact(grid, label, headerRow, range));
  const overallWs = findExact(grid, "WS", headerRow, range);
  const ps = findExact(grid, "PS", headerRow, range);
  if (!rawLabels.length || !overallWs || !ps) throw new Error("The Examination section has an unsupported or incomplete layout.");
  const categoryWeightPercent = categoryWeight(grid, weightsRow, overallWs[1], "Examination");
  let components: { key: string; label: string; weightPercent: number; scoreColumn: number; weightedScoreColumn?: number }[];
  const standard = rawLabels.length === 3 && ["ST1", "ST2", "TE"].every((type) => rawLabels.includes(type));
  if (standard) {
    components = rawLabels.map((key_) => {
      const score = findExact(grid, key_, headerRow, range)!;
      const weighted = findExact(grid, `WS ${key_}`, headerRow, range);
      if (!weighted) throw new Error(`Examination component ${key_} is missing its WS output.`);
      const weightPercent = readNumber(grid, weightsRow, weighted[1], `${key_} examination subweight`);
      if (weightPercent < 0 || weightPercent > 100) throw new Error(`${key_} examination subweight must be between 0 and 100.`);
      return { key: key_, label: key_, weightPercent, scoreColumn: score[1], weightedScoreColumn: weighted[1] };
    });
  } else if (rawLabels.length === 1 && rawLabels[0] === "TE" && !findExact(grid, "WS TE", headerRow, range)) {
    components = [{ key: "TE", label: "TE", weightPercent: 100, scoreColumn: findExact(grid, "TE", headerRow, range)![1] }];
  } else {
    throw new Error("Unsupported Examination layout. Supported layouts are ST1/ST2/TE with matching WS columns, or a single TE component with PS and WS.");
  }
  const componentSum = components.reduce((sum, component) => sum + component.weightPercent, 0);
  if (Math.abs(componentSum - 100) > 0.5) throw new Error("Examination component weights must total 100%.");
  return {
    enabled: true as const,
    categoryWeightPercent,
    components,
    outputs: { percentageScoreColumn: ps[1], weightedScoreColumn: overallWs[1] },
  };
}
