import { useState } from "react";
import { X } from "lucide-react";
import { ACCENT } from "../types/types";
import type { AcademicYear, TermStatus } from "../types/academicyear";

interface EditAcademicYearModalProps {
  academicYear: AcademicYear;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  onClose: () => void;
  onSave: (updates: AcademicYear) => void;
  saving?: boolean;
  error?: string | null;
}

const STATUS_OPTIONS: TermStatus[] = ["Active", "Upcoming", "Completed"];

export function EditAcademicYearModal({
  academicYear,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  onClose,
  onSave,
  saving = false,
  error = null,
}: EditAcademicYearModalProps) {
  const [label, setLabel] = useState(academicYear.label);
  const [startDate, setStartDate] = useState(academicYear.startDate);
  const [endDate, setEndDate] = useState(academicYear.endDate);
  const [status, setStatus] = useState<TermStatus>(academicYear.status);

  const inputClasses = `w-full h-10 px-3 rounded-lg text-sm font-semibold border outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white placeholder:text-[#6B7280]"
      : "bg-white border-[#E5E7EB] text-[#111827] placeholder:text-[#9CA3AF]"
  }`;
  const labelClasses = `block text-xs font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function handleSave() {
    onSave({ label, startDate, endDate, status });
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-xl ${panelBg} ${panelBorder}`}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${panelBorder}`}>
          <h3 className={`text-sm font-black ${textPrimary}`}>
            Edit Academic Year
          </h3>
          <button
            onClick={onClose}
            className={`rounded-lg p-1 transition-colors ${
              darkMode ? "hover:bg-white/10" : "hover:bg-black/5"
            }`}
          >
            <X size={16} className={textMuted} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-xs font-semibold text-red-500">{error}</p>
          )}

          <div>
            <label className={labelClasses}>Year Label</label>
            <input
              className={inputClasses}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 2026–2027"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>Start Date</label>
              <input
                className={inputClasses}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="e.g. June 8, 2026"
              />
            </div>
            <div>
              <label className={labelClasses}>End Date</label>
              <input
                className={inputClasses}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="e.g. March 31, 2027"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Status</label>
            <select
              className={inputClasses}
              value={status}
              onChange={(e) => setStatus(e.target.value as TermStatus)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`flex justify-end gap-2 px-6 py-4 border-t ${panelBorder}`}>
          <button
            onClick={onClose}
            className={`h-10 px-4 rounded-xl text-xs font-bold border transition-colors ${
              darkMode
                ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-4 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: ACCENT }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}