// services/gradeTemplateParser.service.ts
import * as XLSX from "xlsx";
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

function buildGrid(sheet: XLSX.WorkSheet, maxRow: number, maxCol: number): CellGrid {
  const grid: CellGrid = new Map();
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");
  const lastRow = Math.min(maxRow, range.e.r + 1);
  const lastCol = Math.min(maxCol, range.e.c + 1);
  for (let r = 1; r <= lastRow; r++) {
    for (let c = 1; c <= lastCol; c++) {
      const ref = XLSX.utils.encode_cell({ r: r - 1, c: c - 1 });
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

function readNumber(grid: CellGrid, row: number, col: number | undefined): number {
  if (col === undefined) return 0;
  const v = grid.get(key(row, col));
  return typeof v === "number" ? v : 0;
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
    const weight = wsPos ? readNumber(grid, weightsRow, wsPos[1]) : 0;
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
      const weight = wsPos ? readNumber(grid, weightsRow, wsPos[1]) : 0;
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
  return file.arrayBuffer().then((buf) => {
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

    const grid = buildGrid(sheet, 40, 60);

    const wwPos = findText(grid, /WRITTEN.*ORAL WORKS/i);
    const ptPos = findText(grid, /PRODUCT.*PERFORMANCE/i);
    const exPos = findText(grid, /EXAMINATIONS/i);
    const igPos = findText(grid, /^Initial Grade$/i);
    const hpPos = findText(grid, /HIGHEST POSSIBLE SCORE/i);

    if (!wwPos || !ptPos || !exPos || !igPos || !hpPos) {
      throw new Error(
        "Could not locate the expected section headers (Written/Oral Works, Performance Tasks, " +
          "Examinations, Initial Grade, Highest Possible Score) in 'TERM 1'. The file may not match " +
          "the official template layout.",
      );
    }

    const weightsRow = hpPos[0];
    const columnHeaderRow = weightsRow - 1;
    const domainRow = columnHeaderRow - 1;

    const wwRange: [number, number] = [wwPos[1], ptPos[1] - 1];
    const ptRange: [number, number] = [ptPos[1], exPos[1] - 1];
    const exRange: [number, number] = [exPos[1], igPos[1] - 1];

    const ww = parseGroup(grid, "writtenWorks", wwRange, domainRow, columnHeaderRow, weightsRow);
    const pt = parseGroup(grid, "performanceTask", ptRange, domainRow, columnHeaderRow, weightsRow);

    const st1Pos = findExact(grid, "WS ST1", columnHeaderRow, exRange);
    const st2Pos = findExact(grid, "WS ST2", columnHeaderRow, exRange);
    const tePos = findExact(grid, "WS TE", columnHeaderRow, exRange);
    const examWsPos = findExact(grid, "WS", columnHeaderRow, exRange);

    if (!st1Pos || !st2Pos || !tePos || !examWsPos) {
      throw new Error(
        "Could not locate the Exam ST1/ST2/TE weight columns in 'TERM 1'. The file may not match " +
          "the official template layout.",
      );
    }

    const examSubWeights: ExamSubWeights = {
      st1: readNumber(grid, weightsRow, st1Pos[1]),
      st2: readNumber(grid, weightsRow, st2Pos[1]),
      te: readNumber(grid, weightsRow, tePos[1]),
    };
    const examWeightPercent = Math.round(readNumber(grid, weightsRow, examWsPos[1]) * 100 * 100) / 100;

    const weightSum = ww.weightPercent + pt.weightPercent + examWeightPercent;
    if (Math.abs(weightSum - 100) > 0.5) {
      throw new Error(`WW + PT + Exam weights read ${weightSum}%, expected 100%. Check the template.`);
    }
    const subWeightSum = examSubWeights.st1 + examSubWeights.st2 + examSubWeights.te;
    if (Math.abs(subWeightSum - 100) > 0.5) {
      throw new Error(`ST1 + ST2 + TE sub-weights read ${subWeightSum}%, expected 100%. Check the template.`);
    }

    const helperGrid = buildGrid(helperSheet, 60, 10);
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
        igMin: readNumber(helperGrid, r, bCol),
        igMax: readNumber(helperGrid, r, cCol),
        transmuted: readNumber(helperGrid, r, dCol),
      });
    }

    const descriptorTable: DescriptorRow[] = [];
    for (let r = headerRow + 1; helperGrid.has(key(r, fCol)); r++) {
      const descriptor = helperGrid.get(key(r, gCol));
      descriptorTable.push({
        numericalGrade: readNumber(helperGrid, r, fCol),
        descriptor: typeof descriptor === "string" ? descriptor : "",
      });
    }

    if (transmutationTable.length === 0 || descriptorTable.length === 0) {
      throw new Error("The 'HELPER' sheet's transmutation/descriptor tables appear to be empty.");
    }

    return { ww, pt, examWeightPercent, examSubWeights, transmutationTable, descriptorTable };
  });
}
