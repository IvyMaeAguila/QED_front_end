import { useState } from "react";
import { X } from "lucide-react";
import { ACCENT } from "../types/types";
import type { Term } from "../types/academicyear";
import type { TermInput } from "../services/academicyear.service";

interface EditTermDatesModalProps {
  terms: Term[];
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  onClose: () => void;
  onSave: (terms: TermInput[]) => void;
  saving?: boolean;
  error?: string | null;
}

const DEFAULT_TERM_NAMES = ["Term 1", "Term 2", "Term 3"];

interface TermDraft {
  termNumber: number;
  name: string;
  startDate: string;
  endDate: string;
}

function buildInitialDrafts(terms: Term[]): TermDraft[] {
  if (terms.length > 0) {
    return terms
      .slice()
      .sort((a, b) => a.termNumber - b.termNumber)
      .map((t) => ({
        termNumber: t.termNumber,
        name: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
      }));
  }
  // No term data yet — seed three blank rows so the admin can fill them in.
  return DEFAULT_TERM_NAMES.map((name, i) => ({
    termNumber: i + 1,
    name,
    startDate: "",
    endDate: "",
  }));
}

export function EditTermDatesModal({
  terms,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  onClose,
  onSave,
  saving = false,
  error = null,
}: EditTermDatesModalProps) {
  const [drafts, setDrafts] = useState<TermDraft[]>(() =>
    buildInitialDrafts(terms),
  );

  const inputClasses = `w-full h-9 px-3 rounded-lg text-sm font-semibold border outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white placeholder:text-[#6B7280]"
      : "bg-white border-[#E5E7EB] text-[#111827] placeholder:text-[#9CA3AF]"
  }`;
  const labelClasses = `block text-xs font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function updateDraft(termNumber: number, updates: Partial<TermDraft>) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.termNumber === termNumber ? { ...d, ...updates } : d,
      ),
    );
  }

  function handleSave() {
    onSave(drafts);
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-xl ${panelBg} ${panelBorder}`}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${panelBorder}`}>
          <h3 className={`text-sm font-black ${textPrimary}`}>
            Edit Term Dates
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

        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {error && (
            <p className="text-xs font-semibold text-red-500">{error}</p>
          )}

          {terms.length === 0 && (
            <p className={`text-xs font-medium ${textMuted}`}>
              No term dates are set yet. Fill these in and save to configure
              Term 1 through Term 3 for this academic year.
            </p>
          )}

          {drafts.map((draft) => (
            <div
              key={draft.termNumber}
              className={`rounded-xl border p-4 ${panelBorder}`}
            >
              <div className="mb-3">
                <label className={labelClasses}>Term Name</label>
                <input
                  className={inputClasses}
                  value={draft.name}
                  onChange={(e) =>
                    updateDraft(draft.termNumber, { name: e.target.value })
                  }
                  placeholder={`Term ${draft.termNumber}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses}>Start Date</label>
                  <input
                    type="date"
                    className={inputClasses}
                    value={draft.startDate}
                    onChange={(e) =>
                      updateDraft(draft.termNumber, {
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClasses}>End Date</label>
                  <input
                    type="date"
                    className={inputClasses}
                    value={draft.endDate}
                    onChange={(e) =>
                      updateDraft(draft.termNumber, {
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
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
            {saving ? "Saving..." : "Save Term Dates"}
          </button>
        </div>
      </div>
    </div>
  );
}