
import { useRef, useState } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { Student } from "../types/Students";
import { studentService } from "./../services/student-record.service"; // 👈 i-adjust path kung kinakailangan
import {
  fetchGradeLevels,
  fetchSectionByGrade,
} from "./../services/grade-section.service"; // 👈 i-adjust path kung kinakailangan
import {
  parseStudentsExcelFile,
  exportStudentsToExcel,
  downloadStudentImportTemplate,
  type ImportParseResult,
} from "../utils/studentExcel";

interface StudentImportExportToolbarProps {
  filteredStudents: Student[];
  allStudentIds: string[];
  allLrns: string[];

  onImportStudents: (students: Student[]) => void;
  darkMode: boolean;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function StudentImportExportToolbar({
  filteredStudents,
  allStudentIds,
  allLrns,
  onImportStudents,
  darkMode,
  panelBorder,
  textPrimary,
  textMuted,
}: StudentImportExportToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsParsing(true);
    setError(null);
    try {
      const parsed = await parseStudentsExcelFile(file, allStudentIds, allLrns);
      setResult(parsed);
    } catch {
      setError(
        "Couldn't read that file. Make sure it's a valid .xlsx, .xls, or .csv export.",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const confirmImport = async () => {
    if (!result || result.valid.length === 0) {
      setResult(null);
      return;
    }

    setIsSaving(true);
    setError(null);

    const saved: Student[] = [];
    const failures: string[] = [];

    try {
      // 1️⃣ Kunin muna ang lahat ng grade levels, gawing lookup map: "grade 3" -> id
      const gradeLevels = await fetchGradeLevels();
      const gradeLevelMap = new Map<string, number>();
      gradeLevels.forEach((g) => {
        gradeLevelMap.set(g.grade_level.trim().toLowerCase(), g.id);
      });

      // Cache ng sections per gradeLevelId, para hindi paulit-ulit mag-fetch
      const sectionMapCache = new Map<number, Map<string, number>>();

      async function getSectionMap(gradeLevelId: number) {
        if (sectionMapCache.has(gradeLevelId)) {
          return sectionMapCache.get(gradeLevelId)!;
        }
        const sections = await fetchSectionByGrade(String(gradeLevelId));
        const map = new Map<string, number>();
        sections.forEach((s) => {
          map.set(s.section_name.trim().toLowerCase(), s.id);
        });
        sectionMapCache.set(gradeLevelId, map);
        return map;
      }

      // 2️⃣ I-process ang bawat student row nang sunod-sunod
      for (const student of result.valid) {
        const gradeLevelName = String(student.gradeLevel ?? "").trim().toLowerCase();
        const sectionName = String(student.section ?? "").trim().toLowerCase();

        const gradeLevelId = gradeLevelMap.get(gradeLevelName);
        if (!gradeLevelId) {
          failures.push(
            `${student.firstName} ${student.lastName}: unknown grade level "${student.gradeLevel}"`,
          );
          continue;
        }

        const sectionMap = await getSectionMap(gradeLevelId);
        const sectionId = sectionMap.get(sectionName);
        if (!sectionId) {
          failures.push(
            `${student.firstName} ${student.lastName}: unknown section "${student.section}" for grade "${student.gradeLevel}"`,
          );
          continue;
        }

        try {
          const payload = {
            studentId: student.id,
            lrn: student.lrn,
            lastName: student.lastName,
            firstName: student.firstName,
            middleName: student.middleName,
            gender: student.gender,
            gradeLevel: String(gradeLevelId),
            section: String(sectionId),
          };

          const res = await studentService.addNewStudent(payload);
          const newId = res?.data?.id ?? res?.id;

          saved.push({
            ...student,
            studentId: student.id,
            dbId: newId ?? student.dbId,
            id: newId ? String(newId) : student.id,
            gradeLevelId,
            sectionId,
          } as Student);
        } catch (err) {
          failures.push(
            `${student.firstName} ${student.lastName}: ${
              err instanceof Error ? err.message : "failed to save"
            }`,
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed to load grade/section data: ${err.message}`
          : "Failed to load grade/section data.",
      );
      setIsSaving(false);
      return;
    }

    if (saved.length > 0) {
      onImportStudents(saved);
    }

    if (failures.length > 0) {
      setError(
        `${saved.length} saved, ${failures.length} failed. First error: ${failures[0]}`,
      );
    }

    setIsSaving(false);
    setResult(null);
  };

  const buttonBase = darkMode
    ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
    : "border-[#E5E7EB] text-[#475569] hover:bg-[#F6F7FB]";

  return (
    <>
      <div
        className={`flex  flex-wrap items-center gap-2 px-5 py-3 border-t ${panelBorder}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileChosen}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsing}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${buttonBase}`}
        >
          <Upload size={14} />
          {isParsing ? "Reading file..." : "Import Excel"}
        </button>
        <button
          onClick={() => exportStudentsToExcel(filteredStudents)}
          disabled={filteredStudents.length === 0}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${buttonBase}`}
        >
          <Download size={14} />
          Export Excel
        </button>
        <button
          onClick={() => downloadStudentImportTemplate()}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold underline ${textMuted}`}
        >
          <FileSpreadsheet size={13} />
          Template
        </button>

        {error && (
          <p className="w-full text-xs font-semibold text-[#DC2626]">{error}</p>
        )}
      </div>

      {result && (
        <ImportPreviewModal
          result={result}
          isSaving={isSaving}
          darkMode={darkMode}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          onCancel={() => setResult(null)}
          onConfirm={confirmImport}
        />
      )}
    </>
  );
}

function ImportPreviewModal({
  result,
  isSaving,
  darkMode,
  panelBorder,
  textPrimary,
  textMuted,
  onCancel,
  onConfirm,
}: {
  result: ImportParseResult;
  isSaving: boolean;
  darkMode: boolean;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`w-full max-w-lg rounded-2xl border ${panelBorder} p-6 ${
          darkMode ? "bg-[#0B1120]" : "bg-white"
        }`}
      >
        <div className="flex items-start justify-between">
          <h3 className={`text-base font-extrabold ${textPrimary}`}>
            Review import
          </h3>
          <button onClick={onCancel} className={textMuted} disabled={isSaving}>
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#16A34A]">
            <CheckCircle2 size={16} />
            {result.valid.length} student{result.valid.length === 1 ? "" : "s"}{" "}
            ready to import
          </div>
          {result.invalid.length > 0 && (
            <div className="flex items-start gap-2 text-sm font-semibold text-[#D97706]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                {result.invalid.length} row
                {result.invalid.length === 1 ? "" : "s"} skipped due to errors
              </span>
            </div>
          )}
        </div>

        {result.invalid.length > 0 && (
          <div
            className={`mt-3 max-h-40 overflow-y-auto rounded-lg border ${panelBorder} p-3 text-xs`}
          >
            {result.invalid.map((r) => (
              <p key={r.row} className={textMuted}>
                <span className="font-bold">Row {r.row}:</span>{" "}
                {r.errors.join(", ")}
              </p>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className={`rounded-lg border px-4 py-2 text-xs font-bold disabled:opacity-50 ${panelBorder} ${textMuted}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={result.valid.length === 0 || isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D70D6] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isSaving
              ? "Saving..."
              : `Import ${result.valid.length} student${
                  result.valid.length === 1 ? "" : "s"
                }`}
          </button>
        </div>
      </div>
    </div>
  );
}

// import { useRef, useState } from "react";
// import {
//   Upload,
//   Download,
//   FileSpreadsheet,
//   X,
//   AlertTriangle,
//   CheckCircle2,
//   Loader2,
// } from "lucide-react";
// import type { Student } from "../types/Students";
// import { studentService } from "./../services/student-record.service"; // 👈 i-adjust path kung kinakailangan
// import {
//   fetchGradeLevels,
//   fetchSectionByGrade,
// } from "./../services/grade-section.service"; // 👈 i-adjust path kung kinakailangan
// import {
//   parseStudentsExcelFile,
//   exportStudentsToExcel,
//   downloadStudentImportTemplate,
//   type ImportParseResult,
// } from "../utils/studentExcel";
// import { AlertModal } from "../../studentrecords/components/alertModal";

// interface StudentImportExportToolbarProps {
//   filteredStudents: Student[];
//   allStudentIds: string[];
//   allLrns: string[];

//   onImportStudents: (students: Student[]) => void;
//   darkMode: boolean;
//   panelBorder: string;
//   textPrimary: string;
//   textMuted: string;
// }

// type AlertState = {
//   title: string;
//   message: string;
//   variant?: "error" | "warning" | "success" | "info";
// };

// export function StudentImportExportToolbar({
//   filteredStudents,
//   allStudentIds,
//   allLrns,
//   onImportStudents,
//   darkMode,
//   panelBorder,
//   textPrimary,
//   textMuted,
// }: StudentImportExportToolbarProps) {
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [result, setResult] = useState<ImportParseResult | null>(null);
//   const [isParsing, setIsParsing] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [alert, setAlert] = useState<AlertState | null>(null);

//   const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     e.target.value = "";
//     if (!file) return;

//     setIsParsing(true);
//     try {
//       const parsed = await parseStudentsExcelFile(file, allStudentIds, allLrns);
//       setResult(parsed);
//     } catch {
//       setAlert({
//         title: "Couldn't read file",
//         message:
//           "Make sure it's a valid .xlsx, .xls, or .csv export.",
//         variant: "error",
//       });
//     } finally {
//       setIsParsing(false);
//     }
//   };

//   const confirmImport = async () => {
//     if (!result || result.valid.length === 0) {
//       setResult(null);
//       return;
//     }

//     setIsSaving(true);

//     const saved: Student[] = [];
//     const failures: string[] = [];

//     try {
//       // 1️⃣ Kunin muna ang lahat ng grade levels, gawing lookup map: "grade 3" -> id
//       const gradeLevels = await fetchGradeLevels();
//       const gradeLevelMap = new Map<string, number>();
//       gradeLevels.forEach((g) => {
//         gradeLevelMap.set(g.grade_level.trim().toLowerCase(), g.id);
//       });

//       // Cache ng sections per gradeLevelId, para hindi paulit-ulit mag-fetch
//       const sectionMapCache = new Map<number, Map<string, number>>();

//       async function getSectionMap(gradeLevelId: number) {
//         if (sectionMapCache.has(gradeLevelId)) {
//           return sectionMapCache.get(gradeLevelId)!;
//         }
//         const sections = await fetchSectionByGrade(String(gradeLevelId));
//         const map = new Map<string, number>();
//         sections.forEach((s) => {
//           map.set(s.section_name.trim().toLowerCase(), s.id);
//         });
//         sectionMapCache.set(gradeLevelId, map);
//         return map;
//       }

//       // 2️⃣ I-process ang bawat student row nang sunod-sunod
//       for (const student of result.valid) {
//         const gradeLevelName = String(student.gradeLevel ?? "").trim().toLowerCase();
//         const sectionName = String(student.section ?? "").trim().toLowerCase();

//         const gradeLevelId = gradeLevelMap.get(gradeLevelName);
//         if (!gradeLevelId) {
//           failures.push(
//             `${student.firstName} ${student.lastName}: unknown grade level "${student.gradeLevel}"`,
//           );
//           continue;
//         }

//         const sectionMap = await getSectionMap(gradeLevelId);
//         const sectionId = sectionMap.get(sectionName);
//         if (!sectionId) {
//           failures.push(
//             `${student.firstName} ${student.lastName}: unknown section "${student.section}" for grade "${student.gradeLevel}"`,
//           );
//           continue;
//         }

//         try {
//           const payload = {
//             studentId: student.id,
//             lrn: student.lrn,
//             lastName: student.lastName,
//             firstName: student.firstName,
//             middleName: student.middleName,
//             gender: student.gender,
//             gradeLevel: String(gradeLevelId),
//             section: String(sectionId),
//           };

//           const res = await studentService.addNewStudent(payload);
//           const newId = res?.data?.id ?? res?.id;

//           saved.push({
//             ...student,
//             studentId: student.id,
//             dbId: newId ?? student.dbId,
//             id: newId ? String(newId) : student.id,
//             gradeLevelId,
//             sectionId,
//           } as Student);
//         } catch (err) {
//           failures.push(
//             `${student.firstName} ${student.lastName}: ${
//               err instanceof Error ? err.message : "failed to save"
//             }`,
//           );
//         }
//       }
//     } catch (err) {
//       setAlert({
//         title: "Failed to load grade/section data",
//         message:
//           err instanceof Error ? err.message : "Please try again.",
//         variant: "error",
//       });
//       setIsSaving(false);
//       return;
//     }

//     if (saved.length > 0) {
//       onImportStudents(saved);
//     }

//     if (failures.length > 0) {
//       setAlert({
//         title: "Import completed with errors",
//         message: `${saved.length} saved \t${failures.length} failed\n\n${failures[0]}`,
//         variant: "error",
//       });
//     } else if (saved.length > 0) {
//       setAlert({
//         title: "Import successful",
//         message: `${saved.length} student${saved.length === 1 ? "" : "s"} imported successfully.`,
//         variant: "success",
//       });
//     }

//     setIsSaving(false);
//     setResult(null);
//   };

//   const buttonBase = darkMode
//     ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
//     : "border-[#E5E7EB] text-[#475569] hover:bg-[#F6F7FB]";

//   return (
//     <>
//       <div
//         className={`flex  flex-wrap items-center gap-2 px-5 py-3 border-t ${panelBorder}`}
//       >
//         <input
//           ref={fileInputRef}
//           type="file"
//           accept=".xlsx,.xls,.csv"
//           className="hidden"
//           onChange={handleFileChosen}
//         />
//         <button
//           onClick={() => fileInputRef.current?.click()}
//           disabled={isParsing}
//           className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${buttonBase}`}
//         >
//           <Upload size={14} />
//           {isParsing ? "Reading file..." : "Import Excel"}
//         </button>
//         <button
//           onClick={() => exportStudentsToExcel(filteredStudents)}
//           disabled={filteredStudents.length === 0}
//           className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${buttonBase}`}
//         >
//           <Download size={14} />
//           Export Excel
//         </button>
//         <button
//           onClick={() => downloadStudentImportTemplate()}
//           className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold underline ${textMuted}`}
//         >
//           <FileSpreadsheet size={13} />
//           Template
//         </button>
//       </div>

//       {result && (
//         <ImportPreviewModal
//           result={result}
//           isSaving={isSaving}
//           darkMode={darkMode}
//           panelBorder={panelBorder}
//           textPrimary={textPrimary}
//           textMuted={textMuted}
//           onCancel={() => setResult(null)}
//           onConfirm={confirmImport}
//         />
//       )}

//       {alert && (
//         <AlertModal
//           title={alert.title}
//           message={alert.message}
//           variant={alert.variant}
//           darkMode={darkMode}
//           onClose={() => setAlert(null)}
//         />
//       )}
//     </>
//   );
// }

// function ImportPreviewModal({
//   result,
//   isSaving,
//   darkMode,
//   panelBorder,
//   textPrimary,
//   textMuted,
//   onCancel,
//   onConfirm,
// }: {
//   result: ImportParseResult;
//   isSaving: boolean;
//   darkMode: boolean;
//   panelBorder: string;
//   textPrimary: string;
//   textMuted: string;
//   onCancel: () => void;
//   onConfirm: () => void;
// }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
//       <div
//         className={`w-full max-w-lg rounded-2xl border ${panelBorder} p-6 ${
//           darkMode ? "bg-[#0B1120]" : "bg-white"
//         }`}
//       >
//         <div className="flex items-start justify-between">
//           <h3 className={`text-base font-extrabold ${textPrimary}`}>
//             Review import
//           </h3>
//           <button onClick={onCancel} className={textMuted} disabled={isSaving}>
//             <X size={18} />
//           </button>
//         </div>

//         <div className="mt-4 space-y-2">
//           <div className="flex items-center gap-2 text-sm font-semibold text-[#16A34A]">
//             <CheckCircle2 size={16} />
//             {result.valid.length} student{result.valid.length === 1 ? "" : "s"}{" "}
//             ready to import
//           </div>
//           {result.invalid.length > 0 && (
//             <div className="flex items-start gap-2 text-sm font-semibold text-[#D97706]">
//               <AlertTriangle size={16} className="mt-0.5 shrink-0" />
//               <span>
//                 {result.invalid.length} row
//                 {result.invalid.length === 1 ? "" : "s"} skipped due to errors
//               </span>
//             </div>
//           )}
//         </div>

//         {result.invalid.length > 0 && (
//           <div
//             className={`mt-3 max-h-40 overflow-y-auto rounded-lg border ${panelBorder} p-3 text-xs`}
//           >
//             {result.invalid.map((r) => (
//               <p key={r.row} className={textMuted}>
//                 <span className="font-bold">Row {r.row}:</span>{" "}
//                 {r.errors.join(", ")}
//               </p>
//             ))}
//           </div>
//         )}

//         <div className="mt-6 flex justify-end gap-2">
//           <button
//             onClick={onCancel}
//             disabled={isSaving}
//             className={`rounded-lg border px-4 py-2 text-xs font-bold disabled:opacity-50 ${panelBorder} ${textMuted}`}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={onConfirm}
//             disabled={result.valid.length === 0 || isSaving}
//             className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D70D6] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
//           >
//             {isSaving && <Loader2 size={14} className="animate-spin" />}
//             {isSaving
//               ? "Saving..."
//               : `Import ${result.valid.length} student${
//                   result.valid.length === 1 ? "" : "s"
//                 }`}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }