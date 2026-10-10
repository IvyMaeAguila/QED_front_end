import { useState } from "react";
import { Pencil } from "lucide-react";
import { ACCENT, HOLIDAY_TYPE_LABELS, type HolidayType, type CalendarTheme } from "../types/Calendar";
import type { EntryKind } from "./AddCalendarEntriesModal";
import { ModalBody, ModalFooter, ModalFrame, ModalHeader } from "../../components/modal";

export interface EditEntryValue {
  title: string;
  date: string;
  holidayType: HolidayType;
}

interface EditEntryModalProps extends CalendarTheme {
  kind: EntryKind;
  initialValue: EditEntryValue;
  onClose: () => void;
  onSave: (value: EditEntryValue) => void | Promise<void>;
}

export function EditEntryModal({
  kind,
  initialValue,
  onClose,
  onSave,
  darkMode,
  panelBorder,
  textMuted,
}: EditEntryModalProps) {
  const [title, setTitle] = useState(initialValue.title);
  const [date, setDate] = useState(initialValue.date);
  const [holidayType, setHolidayType] = useState<HolidayType>(initialValue.holidayType);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isActivity = kind === "activity";

  const inputClasses = `w-full h-10 px-3 rounded-xl border outline-none transition-colors ${
    darkMode
      ? "bg-panel-dark border-border-dark text-white focus:border-maroon-light"
      : "bg-brand-light border-border-subtle text-[#111827] focus:border-maroon-light"
  }`;
  const labelClasses = `qed-type-label block mb-1.5 ${textMuted}`;

  async function handleSave() {
    if (!title.trim()) return setError("Title is required.");
    if (!date) return setError("Date is required.");
    setError(null);
    setSaving(true);
    try {
      await onSave({ title: title.trim(), date, holidayType });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalFrame shellVariant={darkMode ? "dark" : "standard"} onClose={onClose} size="sm" ariaLabel={`Edit ${isActivity ? "Activity" : "Holiday"}`}>
        <ModalHeader
          title={`Edit ${isActivity ? "Activity" : "Holiday"}`}
          onClose={onClose}
          closeDisabled={saving}
          closeDarkMode={darkMode}
          className="items-center border-b-0 px-5 py-4"
          leading={<Pencil size={15} />}
        />

        <ModalBody className="space-y-4 p-5">
          <div>
            <label className={labelClasses}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClasses} />
          </div>

          <div>
            <label className={labelClasses}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClasses} />
          </div>

          {!isActivity && (
            <div>
              <label className={labelClasses}>Type</label>
              <select value={holidayType} onChange={(e) => setHolidayType(e.target.value as HolidayType)} className={inputClasses}>
                {Object.entries(HOLIDAY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-xs font-bold text-[#B91C1C]">{error}</p>}
        </ModalBody>

        <ModalFooter className={`justify-stretch ${panelBorder}`}>
          <button
            onClick={onClose}
            disabled={saving}
            className={`qed-type-button flex-1 h-10 rounded-xl border transition-colors disabled:opacity-50 ${
              darkMode ? "border-border-dark text-[#D1D5DB] hover:bg-white/10" : "border-border-subtle text-[#374151] hover:bg-brand-light"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="qed-type-button flex-1 h-10 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: ACCENT }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </ModalFooter>
    </ModalFrame>
  );
}
