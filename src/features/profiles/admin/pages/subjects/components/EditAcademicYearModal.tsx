import { useState } from "react";
import { ACCENT } from "../types/types";
import type { AcademicYear, SchoolYearStatus } from "../types/academicyear";
import { ModalBody, ModalFooter, ModalFrame, ModalHeader } from "@shared/components/modal";

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

const STATUS_OPTIONS: SchoolYearStatus[] = ["Active", "Inactive"];

export function EditAcademicYearModal({
  academicYear,
  darkMode,
  panelBorder,
  textPrimary,
  textMuted,
  onClose,
  onSave,
  saving = false,
  error = null,
}: EditAcademicYearModalProps) {
  const [label, setLabel] = useState(academicYear.label);
  const [startDate, setStartDate] = useState(academicYear.startDate ?? "");
  const [endDate, setEndDate] = useState(academicYear.endDate ?? "");
  const [status, setStatus] = useState<SchoolYearStatus>(academicYear.status);

  const inputClasses = `w-full h-10 px-3 rounded-lg text-sm font-semibold border outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white placeholder:text-[#6B7280]"
      : "bg-white border-[#E5E7EB] text-[#111827] placeholder:text-[#9CA3AF]"
  }`;
  const labelClasses = `block text-xs font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function handleSave() {
    onSave({
      ...academicYear,
      label,
      startDate: startDate || null,
      endDate: endDate || null,
      status,
    });
  }

  return (
    <ModalFrame shellVariant={darkMode ? "dark" : "standard"} onClose={onClose} size="narrow" zIndexClass="z-60" ariaLabel="Change Academic Year">
        <ModalHeader
          title="Change Academic Year"
          onClose={onClose}
          closeDarkMode={darkMode}
          closeDisabled={saving}
          titleClassName={textPrimary}
          className={`items-center border-b px-6 py-4 ${panelBorder}`}
        />

        <ModalBody className="space-y-4 px-6 py-5">
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
              onChange={(e) => setStatus(e.target.value as SchoolYearStatus)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </ModalBody>

        <ModalFooter className={panelBorder}>
          <button
            onClick={onClose}
            className={`qed-type-button h-10 px-4 rounded-lg border transition-colors ${
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
            className="qed-type-button h-10 px-4 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: ACCENT }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </ModalFooter>
    </ModalFrame>
  );
}
