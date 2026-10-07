import { useState } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { ACCENT, HOLIDAY_TYPE_LABELS, type HolidayType, type CalendarTheme } from "../types/Calendar";
import { ModalBody, ModalFooter, ModalFrame, ModalHeader } from "../../components/modal";

export type EntryKind = "activity" | "holiday";

export interface DraftEntry {
  key: string;
  title: string;
  date: string;
  holidayType: HolidayType; // may bisa lang para sa holidays
}

let keySeed = 0;
function emptyEntry(): DraftEntry {
  keySeed += 1;
  return { key: `row-${Date.now()}-${keySeed}`, title: "", date: "", holidayType: "regular" };
}

interface AddCalendarEntriesModalProps extends CalendarTheme {
  kind: EntryKind;
  onClose: () => void;
  onSave: (entries: DraftEntry[]) => void | Promise<void>;
}

export function AddCalendarEntriesModal({
  kind,
  onClose,
  onSave,
  darkMode,
  panelBorder,
  textMuted,
}: AddCalendarEntriesModalProps) {
  const [rows, setRows] = useState<DraftEntry[]>([emptyEntry()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isActivity = kind === "activity";
  const heading = isActivity ? "Add Activities" : "Add Holidays";

  const inputClasses = `w-full h-10 px-3 rounded-xl border outline-none transition-colors ${
    darkMode
      ? "bg-[#2A1A18] border-[#543632] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const labelClasses = `qed-type-label block mb-1.5 ${textMuted}`;

  function updateRow(key: string, patch: Partial<DraftEntry>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, emptyEntry()]);
  }
  function removeRow(key: string) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.key !== key)));
  }

  async function handleSave() {
    const cleaned = rows.filter((r) => r.title.trim() && r.date);
    if (cleaned.length === 0) return setError("Add at least one title and date.");
    setError(null);
    setSaving(true);
    try {
      await onSave(cleaned);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalFrame shellVariant={darkMode ? "dark" : "standard"} onClose={onClose} size="md" ariaLabel={heading} className="max-h-[90vh]">
        <ModalHeader
          title={heading}
          onClose={onClose}
          closeDisabled={saving}
          closeDarkMode={darkMode}
          className="items-center border-b-0 px-5 py-4"
          leading={<CalendarDays size={15} />}
        />

        <ModalBody className="space-y-4 p-5">
          {rows.map((row, idx) => (
            <div key={row.key} className={`rounded-xl border p-4 space-y-3 ${panelBorder}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${textMuted}`}>
                  {isActivity ? "Activity" : "Holiday"} {idx + 1}
                </span>
                {rows.length > 1 && (
                  <button
                    onClick={() => removeRow(row.key)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[#B91C1C] hover:bg-[#FDF2F2] transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <div>
                <label className={labelClasses}>Title</label>
                <input
                  value={row.title}
                  onChange={(e) => updateRow(row.key, { title: e.target.value })}
                  className={inputClasses}
                  placeholder={isActivity ? "Opening Block" : "Ninoy Aquino Day"}
                />
              </div>

              <div>
                <label className={labelClasses}>Date</label>
                <input
                  type="date"
                  value={row.date}
                  onChange={(e) => updateRow(row.key, { date: e.target.value })}
                  className={inputClasses}
                />
              </div>

              {!isActivity && (
                <div>
                  <label className={labelClasses}>Type</label>
                  <select
                    value={row.holidayType}
                    onChange={(e) => updateRow(row.key, { holidayType: e.target.value as HolidayType })}
                    className={inputClasses}
                  >
                    {Object.entries(HOLIDAY_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addRow}
            className={`w-full h-10 rounded-xl border border-dashed text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
              darkMode ? "border-[#543632] text-[#D1D5DB] hover:bg-white/5" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            <Plus size={14} />
            Add Another {isActivity ? "Activity" : "Holiday"}
          </button>

          {error && <p className="text-xs font-bold text-[#B91C1C]">{error}</p>}
        </ModalBody>

        <ModalFooter className={`justify-stretch ${panelBorder}`}>
          <button
            onClick={onClose}
            disabled={saving}
            className={`qed-type-button flex-1 h-10 rounded-xl border transition-colors disabled:opacity-50 ${
              darkMode ? "border-[#543632] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
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
            {saving ? "Saving…" : "Save"}
          </button>
        </ModalFooter>
    </ModalFrame>
  );
}
