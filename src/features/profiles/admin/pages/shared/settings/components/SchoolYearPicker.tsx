import { useState } from "react";
import { Check } from "lucide-react";
import { buildSchoolYearOptions, isValidSchoolYearFormat, normalizeSchoolYear } from "../types/Settings";

const ACCENT = "#6B0000";

interface SchoolYearPickerProps {
  value: string;
  onChange: (year: string) => void;
  darkMode: boolean;
}

export function SchoolYearPicker({ value, onChange, darkMode }: SchoolYearPickerProps) {
  const options = buildSchoolYearOptions();
  const isCustomValue = !options.includes(value);
  const [customInput, setCustomInput] = useState(isCustomValue ? value : "");
  const [customError, setCustomError] = useState<string | null>(null);

  function applyCustom() {
    if (!isValidSchoolYearFormat(customInput)) {
      setCustomError("Use the format 2030-2031");
      return;
    }
    setCustomError(null);
    onChange(normalizeSchoolYear(customInput));
  }

  const mutedText = darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]";
  const inputClasses = `flex-1 h-9 px-2.5 rounded-lg border text-xs font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#6B0000]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#6B0000]"
  }`;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {options.map((year) => {
          const selected = year === value;
          return (
            <button
              key={year}
              onClick={() => onChange(year)}
              className={`h-8 px-3 rounded-lg text-xs font-bold border transition-colors inline-flex items-center gap-1.5 ${
                selected
                  ? "text-white"
                  : darkMode
                  ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                  : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
              }`}
              style={selected ? { background: ACCENT, borderColor: ACCENT } : undefined}
            >
              {selected && <Check size={12} />}
              {year}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={customInput}
          onChange={(e) => {
            setCustomInput(e.target.value);
            setCustomError(null);
          }}
          placeholder="Custom, e.g. 2030-2031"
          className={inputClasses}
        />
        <button
          onClick={applyCustom}
          className="h-9 px-3 rounded-lg text-xs font-bold text-white shrink-0 transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          Set
        </button>
      </div>

      {customError && <p className="text-[11px] font-bold text-[#B91C1C]">{customError}</p>}

      <p className={`text-[11px] font-semibold ${mutedText}`}>
        Subjects, classes, and the calendar are dated against this year.
      </p>
    </div>
  );
}