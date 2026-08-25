import { useState } from "react";
import { X, Pencil } from "lucide-react";
import { ACCENT, HOLIDAY_TYPE_LABELS, type HolidayType, type CalendarTheme } from "../types/Calendar";
import type { EntryKind } from "./AddCalendarEntriesModal";

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
  panelBg,
  panelBorder,
  textMuted,
}: EditEntryModalProps) {
  const [title, setTitle] = useState(initialValue.title);
  const [date, setDate] = useState(initialValue.date);
  const [holidayType, setHolidayType] = useState<HolidayType>(initialValue.holidayType);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isActivity = kind === "activity";

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className={`w-full max-w-sm rounded-2xl border shadow-xl overflow-hidden flex flex-col ${panelBg} ${panelBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: ACCENT }}>
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Pencil size={15} />
            Edit {isActivity ? "Activity" : "Holiday"}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
            <X size={14} className="text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4">
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
        </div>

        <div className={`p-5 border-t flex gap-3 shrink-0 ${panelBorder}`}>
          <button
            onClick={onClose}
            disabled={saving}
            className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 ${
              darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: ACCENT }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}