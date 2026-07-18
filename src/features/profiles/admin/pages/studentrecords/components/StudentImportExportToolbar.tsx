import { useRef, useState } from "react";
import { Upload, Download, FileSpreadsheet, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Student } from "../types/Students";
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
      setError("Couldn't read that file. Make sure it's a valid .xlsx, .xls, or .csv export.");
    } finally {
      setIsParsing(false);
    }
  };

  const confirmImport = () => {
    if (result && result.valid.length > 0) {
      onImportStudents(result.valid);
    }
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
  darkMode,
  panelBorder,
  textPrimary,
  textMuted,
  onCancel,
  onConfirm,
}: {
  result: ImportParseResult;
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
          <h3 className={`text-base font-extrabold ${textPrimary}`}>Review import</h3>
          <button onClick={onCancel} className={textMuted}>
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#16A34A]">
            <CheckCircle2 size={16} />
            {result.valid.length} student{result.valid.length === 1 ? "" : "s"} ready to import
          </div>
          {result.invalid.length > 0 && (
            <div className="flex items-start gap-2 text-sm font-semibold text-[#D97706]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                {result.invalid.length} row{result.invalid.length === 1 ? "" : "s"} skipped due to errors
              </span>
            </div>
          )}
        </div>

        {result.invalid.length > 0 && (
          <div className={`mt-3 max-h-40 overflow-y-auto rounded-lg border ${panelBorder} p-3 text-xs`}>
            {result.invalid.map((r) => (
              <p key={r.row} className={textMuted}>
                <span className="font-bold">Row {r.row}:</span> {r.errors.join(", ")}
              </p>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className={`rounded-lg border px-4 py-2 text-xs font-bold ${panelBorder} ${textMuted}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={result.valid.length === 0}
            className="rounded-lg bg-[#1D70D6] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            Import {result.valid.length} student{result.valid.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}