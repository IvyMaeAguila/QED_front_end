import { useState } from "react";
import { ACCENT } from "../types/types";
import type { Term } from "../types/academicyear";
import type { TermInput } from "../services/academicyear.service";
import { ModalBody, ModalFooter, ModalFrame, ModalHeader } from "@shared/components/modal";

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

interface TermDraft {
  termNumber: number;
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
        startDate: t.startDate ?? "",
        endDate: t.endDate ?? "",
      }));
  }
  // No term rows at all yet — seed three blank rows so the admin can fill them in.
  return [1, 2, 3].map((termNumber) => ({
    termNumber,
    startDate: "",
    endDate: "",
  }));
}

export function EditTermDatesModal({
  terms,
  darkMode,
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
    <ModalFrame shellVariant={darkMode ? "dark" : "standard"} onClose={onClose} size="md" zIndexClass="z-60" ariaLabel="Edit Term Dates">
        <ModalHeader
          title="Edit Term Dates"
          onClose={onClose}
          closeDarkMode={darkMode}
          closeDisabled={saving}
          titleClassName={textPrimary}
          className={`items-center border-b px-6 py-4 ${panelBorder}`}
        />

        <ModalBody className="max-h-[60vh] space-y-5 px-6 py-5">
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
              className={`rounded-[12px] border p-4 ${panelBorder}`}
            >
              <p className={`text-xs font-black uppercase tracking-wide mb-3 ${textPrimary}`}>
                Term {draft.termNumber}
              </p>
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
            {saving ? "Saving..." : "Save Term Dates"}
          </button>
        </ModalFooter>
    </ModalFrame>
  );
}
