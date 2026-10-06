import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { FileSpreadsheet, Upload, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { parseGradeTemplate, type ParsedGradeTemplate } from "../services/gradeTemplateParser.service";
import {
  uploadGradeTemplate,
  type ActiveGradeTemplate,
} from "../services/subjectGradeTemplate.service";

interface Props {
  subjectId: number;
  darkMode: boolean;
  activeTemplate: ActiveGradeTemplate | null;
  onTemplateUpdated: (template: ActiveGradeTemplate) => void;
}

function formatGroup(group: ParsedGradeTemplate["ww"]): string {
  if (group.domains.length === 1) {
    return `${group.weightPercent}%`;
  }
  const parts = group.domains.map((d) => `${d.label} ${d.weightPercent}%`);
  return `${group.weightPercent}% total (${parts.join(" + ")})`;
}

export function SubjectGradeTemplateSection({
  subjectId,
  darkMode,
  activeTemplate,
  onTemplateUpdated,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ParsedGradeTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setPreview(null);
    setUploading(true);
    try {
      // Client-side preview first — instant feedback, not authoritative.
      const previewResult = await parseGradeTemplate(file);
      setPreview(previewResult);

      // Server re-parses and persists authoritatively.
      const saved = await uploadGradeTemplate(subjectId, file);
      onTemplateUpdated(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process that file.");
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const cardClasses = `rounded-[12px] border p-4 space-y-3 ${
    darkMode ? "border-[#374151] bg-[#0B1120]/60" : "border-[#E5E7EB] bg-[#F8FAFC]"
  }`;

  return (
    <div className={cardClasses}>
      <div className="flex items-center gap-2">
        <FileSpreadsheet size={14} />
        <span className="text-xs font-bold uppercase tracking-wider">
          Official DepEd Grade Template
        </span>
      </div>

      <p className="text-xs opacity-70 leading-relaxed">
        Use the official DepEd Electronic Class Record configured for this
        subject. Replacing it affects new grading periods; periods already
        using an earlier version keep that workbook.
      </p>

      {activeTemplate && (
        <div className="flex flex-col gap-1 rounded-lg border border-current/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">Current Template</p>
            <p className="truncate text-sm font-semibold" title={activeTemplate.file_name}>{activeTemplate.file_name}</p>
          </div>
          <span className="w-fit shrink-0 rounded-full bg-emerald-600/10 px-2 py-1 text-[11px] font-bold text-emerald-700">Active</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        disabled={uploading}
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!uploading) setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={handleDrop}
        className={`rounded-[12px] border-2 border-dashed py-6 px-4 flex flex-col items-center gap-2 text-center cursor-pointer transition-colors ${
          isDragOver ? "border-[#2F6FED] bg-[#2F6FED]/5" : darkMode ? "border-[#374151]" : "border-[#D1D5DB]"
        } ${uploading ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        {uploading ? (
          <Loader2 size={22} className="animate-spin text-[#2F6FED]" />
        ) : (
          <Upload size={22} className="text-[#2F6FED]" />
        )}
        <p className="text-sm font-bold">
          {uploading ? "Processing…" : "Drop an .xlsx here or choose a file"}
        </p>
      </div>

      {!uploading && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#8B0000" }}
        >
          {activeTemplate ? "Replace Template" : "Upload Template"}
        </button>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs font-semibold text-[#B91C1C]">
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {preview && !error && (
        <div className="text-xs space-y-1 pt-2 border-t border-current/10">
          <div className="flex items-center gap-2 font-semibold text-[#15803D] mb-1">
            <CheckCircle size={14} />
            Template saved
          </div>
          <p>WW: {formatGroup(preview.ww)}</p>
          <p>PT: {formatGroup(preview.pt)}</p>
          {preview.examinations?.enabled ? <>
            <p>Examinations: {preview.examWeightPercent}%</p>
            <p>Components — {preview.examinations.components.map((component) => `${component.label}: ${component.weightPercent}%`).join(" · ")}</p>
          </> : <p>Examinations: not included in this template.</p>}
        </div>
      )}

      {!preview && activeTemplate && !error && (
        <div className="text-xs space-y-1 pt-2 border-t border-current/10">
          <div className="flex items-center gap-2 font-semibold text-[#15803D] mb-1">
            <CheckCircle size={14} />
            Active template on file
          </div>
          <p>
            WW: {activeTemplate.wwWeightPercent}% · PT: {activeTemplate.ptWeightPercent}% · Exam:{" "}
            {activeTemplate.examWeightPercent}%
          </p>
          <p>
            Exam sub-weights — ST1: {activeTemplate.examSt1SubweightPercent}% · ST2:{" "}
            {activeTemplate.examSt2SubweightPercent}% · TE: {activeTemplate.examTeSubweightPercent}%
          </p>
        </div>
      )}
    </div>
  );
}
