import { QUARTERS, QUARTER_LABELS, type Quarter } from "../types/types";

interface QuarterTabsProps {
  active: Quarter;
  onChange: (quarter: Quarter) => void;
  darkMode: boolean;
}

export function QuarterTabs({ active, onChange, darkMode }: QuarterTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {QUARTERS.map((q) => {
        const isActive = q === active;
        return (
          <button
            key={q}
            type="button"
            onClick={() => onChange(q)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? "bg-[#8B0D0D] text-white"
                : darkMode
                  ? "bg-white/5 text-[#9CA3AF] hover:text-white"
                  : "bg-[#F1F2F4] text-[#6B7280] hover:text-[#374151]"
            }`}
          >
            {QUARTER_LABELS[q]}
          </button>
        );
      })}
    </div>
  );
}