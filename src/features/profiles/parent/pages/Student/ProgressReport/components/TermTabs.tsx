import { TERMS, TERM_LABELS, type TermFilter } from "../types/types";

interface TermTabsProps {
  active: TermFilter;
  onChange: (term: TermFilter) => void;
  darkMode: boolean;
}

const OVERALL_LABEL = "Overall";

export function TermTabs({ active, onChange, darkMode }: TermTabsProps) {
  const filters: TermFilter[] = [...TERMS, "OVERALL"];

  return (
    <div className="flex items-center gap-2">
      {filters.map((t) => {
        const isActive = t === active;
        const label = t === "OVERALL" ? OVERALL_LABEL : TERM_LABELS[t];

        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-center text-xs font-semibold transition-colors ${
              isActive
                ? "bg-maroon text-white"
                : darkMode
                  ? "bg-white/5 text-[#9CA3AF] hover:text-white"
                  : "bg-brand-light text-[#6B7280] hover:text-[#374151]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}