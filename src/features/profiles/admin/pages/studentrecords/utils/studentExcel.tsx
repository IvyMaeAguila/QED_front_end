import ExcelJS from "exceljs";
import type { Student } from "../types/Students";


export const STUDENT_COLUMN_MAP: Record<string, keyof Student> = {
  "Student ID": "id",
  "LRN": "lrn",
  "First Name": "firstName",
  "Middle Name": "middleName",
  "Last Name": "lastName",
  "Gender": "gender",
  "Grade Level": "gradeLevel",
  "Section": "section",
};

const REQUIRED_FIELDS: (keyof Student)[] = [
  "id",
  "lrn",
  "firstName",
  "lastName",
  "gender",
  "gradeLevel",
  "section",
];

const LRN_PATTERN = /^\d{12}$/; 

export interface ImportRowResult {
  row: number;
  data: Partial<Student> | null;
  errors: string[];
}

export interface ImportParseResult {
  valid: Student[];
  invalid: ImportRowResult[];
}

export async function parseStudentsExcelFile(
  file: File,
  existingStudentIds: string[] = [],
  existingLrns: string[] = []
): Promise<ImportParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return { valid: [], invalid: [] };
  }

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "").trim();
  });

  const valid: Student[] = [];
  const invalid: ImportRowResult[] = [];
  const usedIds = new Set(existingStudentIds);
  const usedLrns = new Set(existingLrns);

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const student: Partial<Student> = {};
    headers.forEach((header, colNumber) => {
      if (!header) return;
      const field = STUDENT_COLUMN_MAP[header];
      if (!field) return;
      const raw = row.getCell(colNumber).value;
      if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
        (student as Record<string, unknown>)[field] = String(raw).trim();
      }
    });

    if (Object.keys(student).length === 0) return;

    const errors: string[] = [];
    for (const field of REQUIRED_FIELDS) {
      if (!student[field]) errors.push(`Missing "${field}"`);
    }

    if (student.gender && !["Male", "Female"].includes(String(student.gender))) {
      errors.push('Gender must be "Male" or "Female"');
    }

    if (student.lrn) {
      if (!LRN_PATTERN.test(String(student.lrn))) {
        errors.push("LRN must be exactly 12 digits");
      } else if (usedLrns.has(String(student.lrn))) {
        errors.push(`Duplicate LRN "${student.lrn}"`);
      } else {
        usedLrns.add(String(student.lrn));
      }
    }

    if (student.id) {
      if (usedIds.has(String(student.id))) {
        errors.push(`Duplicate Student ID "${student.id}"`);
      } else {
        usedIds.add(String(student.id));
      }
    }

    if (errors.length > 0) {
      invalid.push({ row: rowNumber, data: student, errors });
    } else {
      valid.push(student as Student);
    }
  });

  return { valid, invalid };
}


// export async function exportStudentsToExcel(
//   students: Student[],
//   filename = "students-export.xlsx"
// ) {
//   const headers = Object.keys(STUDENT_COLUMN_MAP);
//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet("Students");

//   worksheet.columns = headers.map((h) => ({
//     header: h,
//     key: h,
//     width: Math.max(h.length + 2, 14),
//   }));
//   worksheet.getRow(1).font = { bold: true };

// students.forEach((s) => {
//   const row: Record<string, string> = {};
//   for (const [header, field] of Object.entries(STUDENT_COLUMN_MAP)) {
//     const value = s[field]; 
//     row[header] = String(value ?? "");
//   }
//   worksheet.addRow(row);
// });

//   await downloadWorkbook(workbook, filename);
// }

export async function downloadStudentImportTemplate(
  filename = "student-import-template.xlsx"
) {
  const headers = Object.keys(STUDENT_COLUMN_MAP);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Template");
  worksheet.columns = headers.map((h) => ({
    header: h,
    key: h,
    width: Math.max(h.length + 2, 14),
  }));
  worksheet.getRow(1).font = { bold: true };

  await downloadWorkbook(workbook, filename);
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportStudentsToExcel(
  students: Student[],
  filename = "students-export.xlsx"
) {
  const headers = Object.keys(STUDENT_COLUMN_MAP);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Students");

  worksheet.columns = headers.map((h) => ({
    header: h,
    key: h,
    width: Math.max(h.length + 2, 14),
  }));
  worksheet.getRow(1).font = { bold: true };

  students.forEach((s) => {
    const row: Record<string, string> = {};
    for (const [header, field] of Object.entries(STUDENT_COLUMN_MAP)) {
      // "Student ID" dapat ang studentId (student number), hindi ang
      // internal DB id na nasa `id` pagkatapos ma-save.
      const value = field === "id" ? s.studentId ?? s.id : s[field];
      row[header] = String(value ?? "");
    }
    worksheet.addRow(row);
  });

  await downloadWorkbook(workbook, filename);
}