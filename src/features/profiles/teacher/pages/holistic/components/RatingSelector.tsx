import { RATING_LEVELS, getRatingLevel } from "../types/Holistic";

interface RatingSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
  darkMode: boolean;
  textMuted: string;
}

export function RatingSelector({ value, onChange, darkMode, textMuted }: RatingSelectorProps) {
  const level = getRatingLevel(value);

  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5">
        {RATING_LEVELS.map((l) => {
          const selected = value === l.value;
          return (
            <button
              key={l.value}
              type="button"
              onClick={() => onChange(l.value)}
              title={l.label}
              className={`h-9 rounded-lg text-[11px] font-bold border transition-all ${
                selected
                  ? "text-white shadow-sm scale-[1.03]"
                  : darkMode
                  ? "border-[#374151] text-[#D1D5DB] hover:bg-white/5"
                  : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
              }`}
              style={selected ? { background: l.color, borderColor: l.color } : undefined}
            >
              {l.value}
            </button>
          );
        })}
      </div>
      <p className={`mt-1.5 text-[11px] font-bold ${level ? "" : textMuted}`} style={level ? { color: level.color } : undefined}>
        {level ? level.label : "Not rated yet"}
      </p>
    </div>
  );
}