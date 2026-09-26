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

  const cardClasses = `rounded-xl border p-4 space-y-3 ${
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
        Upload the official DepEd Electronic Class Record (.xlsx) for this
        subject. Its WW/PT/Exam weights, any WW/PT domain breakdown (e.g.
        Cognitive/Affective/Behavioral), and ST1/ST2/TE sub-weights will
        replace manual weight entry.
      </p>

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
        className={`rounded-xl border-2 border-dashed py-6 px-4 flex flex-col items-center gap-2 text-center cursor-pointer transition-colors ${
          isDragOver ? "border-[#2F6FED] bg-[#2F6FED]/5" : darkMode ? "border-[#374151]" : "border-[#D1D5DB]"
        } ${uploading ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        {uploading ? (
          <Loader2 size={22} className="animate-spin text-[#2F6FED]" />
        ) : (
          <Upload size={22} className="text-[#2F6FED]" />
        )}
        <p className="text-sm font-bold">
          {uploading ? "Processing…" : "Drag the .xlsx here or click to browse"}
        </p>
      </div>

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
            New template parsed
          </div>
          <p>WW: {formatGroup(preview.ww)}</p>
          <p>PT: {formatGroup(preview.pt)}</p>
          <p>Exam: {preview.examWeightPercent}%</p>
          <p>
            Exam sub-weights — ST1: {preview.examSubWeights.st1}% · ST2:{" "}
            {preview.examSubWeights.st2}% · TE: {preview.examSubWeights.te}%
          </p>
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