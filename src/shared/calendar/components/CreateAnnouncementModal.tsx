import { useState } from "react";
import { X, Megaphone } from "lucide-react";
import { ACCENT, type AnnouncementAudience, type CalendarTheme, type Role } from "../types/Calendar";
import { toISODate } from "../data";
import { AudienceTargetPicker } from "./AudienceTargetPicker";
import { type GradeLevel } from "../../../features/profiles/admin/pages/studentrecords/types/Students";

export interface NewAnnouncementInput {
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  audience: AnnouncementAudience;
}

interface CreateAnnouncementModalProps extends CalendarTheme {
  posterRole: Role;
  posterName: string;
  defaultDate: Date;
  availableSectionsForGrade: (gradeLevel: GradeLevel | undefined) => string[];
  lockedGradeLevel?: GradeLevel;
  lockedSection?: string;
  onClose: () => void;
  onCreate: (event: NewAnnouncementInput) => void | Promise<void>;
}

export function CreateAnnouncementModal({
  posterRole,
  posterName,
  defaultDate,
  availableSectionsForGrade,
  lockedGradeLevel,
  lockedSection,
  onClose,
  onCreate,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: CreateAnnouncementModalProps) {
  const isTeacher = posterRole === "TEACHER";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(toISODate(defaultDate));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>(
    isTeacher
      ? { roles: ["PARENT"], gradeLevel: lockedGradeLevel, section: lockedSection }
      : { roles: [] }
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const textareaClasses = `w-full px-3 py-2 rounded-xl border text-sm font-semibold outline-none transition-colors resize-none ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  async function handleSubmit() {
    if (!title.trim()) return setError("Title is required.");
    if (!date) return setError("Date is required.");
    if (audience.roles.length === 0) return setError("Pick at least one audience.");

    setError(null);
    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        audience,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post announcement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden max-h-[90vh] flex flex-col ${panelBg} ${panelBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: ACCENT }}>
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Megaphone size={15} />
            New Announcement
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className={labelClasses}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClasses} placeholder="Math Quiz - Grade 1" />
          </div>

          <div>
            <label className={labelClasses}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={textareaClasses}
              rows={3}
              placeholder="Details for whoever sees this…"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClasses}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClasses} />
            </div>
          </div>

          <div className={`pt-2 border-t ${panelBorder}`}>
            <AudienceTargetPicker
              posterRole={posterRole}
              audience={audience}
              onChange={setAudience}
              availableSections={availableSectionsForGrade(audience.gradeLevel)}
              darkMode={darkMode}
              textMuted={textMuted}
              textPrimary={textPrimary}
              lockedGradeLevel={lockedGradeLevel}
              lockedSection={lockedSection}
            />
          </div>

          {error && <p className="text-xs font-bold text-[#B91C1C]">{error}</p>}
        </div>

        <div className={`p-5 border-t flex gap-3 shrink-0 ${panelBorder}`}>
          <button
            onClick={onClose}
            disabled={submitting}
            className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 ${
              darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 h-10 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: ACCENT }}
          >
            {submitting ? "Posting…" : "Post Announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}