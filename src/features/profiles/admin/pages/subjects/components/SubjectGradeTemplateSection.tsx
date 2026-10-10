import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { FileSpreadsheet, Upload, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { parseGradeTemplate, type ParsedGradeTemplate } from "../services/gradeTemplateParser.service";
import {
  uploadGradeTemplate,
  type ActiveGradeTemplate,
} from "../services/subjectGradeTemplate.service";
import { SkeletonText } from "@shared/components/SkeletonLoading";

interface Props {
  subjectId: number;
  darkMode: boolean;
  activeTemplate: ActiveGradeTemplate | null;
  onTemplateUpdated: (template: ActiveGradeTemplate) => void;
  loading?: boolean;
  disabled?: boolean;
  onTemplateSelected?: (file: File, preview: ParsedGradeTemplate) => void;
  onProcessingChange?: (processing: boolean) => void;
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
  loading = false,
  disabled = false,
  onTemplateSelected,
  onProcessingChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ParsedGradeTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  async function handleFile(file: File) {
    if (uploading || loading || disabled) return;
    setError(null);
    setUploading(true);
    onProcessingChange?.(true);
    try {
      // Client-side preview first — instant feedback, not authoritative.
      const previewResult = await parseGradeTemplate(file);
      setPreview(previewResult);
      setPendingFile(file);
      onTemplateSelected?.(file, previewResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process that file.");
    } finally {
      setUploading(false);
      onProcessingChange?.(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveTemplate() {
    if (!pendingFile || uploading || loading || disabled) return;
    setUploading(true);
    setError(null);
    try {
      const saved = await uploadGradeTemplate(subjectId, pendingFile);
      onTemplateUpdated(saved);
      setPendingFile(null);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that template.");
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (uploading || loading || disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const cardClasses = `rounded-[12px] border p-4 space-y-3 ${
    darkMode ? "border-[#374151] bg-[#0B1120]/60" : "border-border-subtle bg-brand-light"
  }`;

  return (
    <div className={cardClasses} data-sk-region="subjectgradetemplatesection-div-field-1">
      <div className="flex items-center gap-2">
        <FileSpreadsheet size={14} />
        <span className="text-xs font-bold uppercase tracking-wider" data-sk-region="subjectgradetemplatesection-official-deped-grade-template" data-sk-static="">
          Official DepEd Grade Template
        </span>
      </div>

      <p className="text-xs opacity-70 leading-relaxed" data-sk-region="subjectgradetemplatesection-use-the-official-deped-electronic-class-recor" data-sk-static="">
        Use the official DepEd Electronic Class Record configured for this
        subject. Replacing it affects new grading periods; periods already
        using an earlier version keep that workbook.
      </p>

      {(loading || activeTemplate) && (
        <div data-sk-region="current-template" data-sk-variable="" className="flex flex-col gap-1 rounded-lg border border-current/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-60" data-sk-region="subjectgradetemplatesection-current-template" data-sk-static="">Current Template</p>
            <p data-sk-region="template-file-name" className="truncate text-sm font-semibold" title={activeTemplate?.file_name}>{loading ? <SkeletonText width="22ch" /> : activeTemplate?.file_name}</p>
          </div>
          <span className="w-fit shrink-0 rounded-full bg-emerald-600/10 px-2 py-1 text-xs font-bold text-emerald-700" data-sk-region="subjectgradetemplatesection-active" data-sk-static="">Active</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        disabled={uploading || loading || disabled}
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        onClick={() => !uploading && !loading && !disabled && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!uploading && !loading && !disabled) setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={handleDrop}
        data-upload-progress={uploading ? "" : undefined}
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
          disabled={loading || disabled}
          onClick={() => fileInputRef.current?.click()}
          className="sk-surface-brand w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--color-maroon)" }} data-sk-region="subjectgradetemplatesection-button-field-3"
        >
          {loading ? <SkeletonText width="14ch" className="mx-auto" /> : activeTemplate ? "Replace Template" : "Upload Template"}
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
            Ready to save — {pendingFile?.name}
          </div>
          <p>WW: {formatGroup(preview.ww)}</p>
          <p>PT: {formatGroup(preview.pt)}</p>
          {preview.examinations?.enabled ? <>
            <p>Examinations: {preview.examWeightPercent}%</p>
            <p>Components — {preview.examinations.components.map((component) => `${component.label}: ${component.weightPercent}%`).join(" · ")}</p>
          </> : <p data-sk-region="subjectgradetemplatesection-examinations-not-included-in-this-template-" data-sk-static="">Examinations: not included in this template.</p>}
          <p>{onTemplateSelected ? "Click Save Changes to apply this template." : "Click Save Template to apply this template."}</p>
        </div>
      )}

      {pendingFile && !onTemplateSelected && (
        <button type="button" disabled={uploading || loading || disabled} onClick={() => void handleSaveTemplate()}
          className="w-full rounded-lg bg-maroon px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {uploading ? "Saving…" : "Save Template"}
        </button>
      )}

      {!preview && (loading || activeTemplate) && !error && (
        <div data-sk-region="template-weight-summary" data-sk-variable="" className="text-xs space-y-1 pt-2 border-t border-current/10">
          <div className="flex items-center gap-2 font-semibold text-[#15803D] mb-1">
            <CheckCircle size={14} />
            Active template on file
          </div>
          <p data-sk-region="subjectgradetemplatesection-p-field-4">
            WW: {loading ? <SkeletonText width="2ch" className="inline-block align-top" /> : activeTemplate?.wwWeightPercent}% · PT: {loading ? <SkeletonText width="2ch" className="inline-block align-top" /> : activeTemplate?.ptWeightPercent}% · Exam:{" "}
            {loading ? <SkeletonText width="2ch" className="inline-block align-top" /> : activeTemplate?.examWeightPercent}%
          </p>
          <p data-sk-region="subjectgradetemplatesection-p-field-5">
            Exam sub-weights — ST1: {loading ? <SkeletonText width="2ch" className="inline-block align-top" /> : activeTemplate?.examSt1SubweightPercent}% · ST2:{" "}
            {loading ? <SkeletonText width="2ch" className="inline-block align-top" /> : activeTemplate?.examSt2SubweightPercent}% · TE: {loading ? <SkeletonText width="2ch" className="inline-block align-top" /> : activeTemplate?.examTeSubweightPercent}%
          </p>
        </div>
      )}
    </div>
  );
}
