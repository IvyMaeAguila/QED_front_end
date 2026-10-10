import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { useRef, useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { Check, ChevronDown, Filter as FilterIcon } from "lucide-react";

interface FilterDropdownProps {
  loading?: boolean;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  darkMode: boolean;
}

// Custom-built dropdown per design spec (native <select> styling is not used).
// Check icon marks the selected option in accent color (the MSEUF brand token).
export function FilterDropdown({
  loading,
  label,
  value,
  options,
  onChange,
  darkMode,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} data-sk-variable={loading === undefined ? undefined : ""} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`qed-filter-control px-3 rounded-lg flex items-center gap-2 border transition-colors ${
          darkMode
            ? "bg-[#111827] border-[#1F2937] text-white hover:border-[#374151]"
            : "bg-white border-border-subtle text-[#111827] hover:border-maroon-light"
        }`}
      >
        <FilterIcon size={14} className={darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"} />
        <span className="text-xs font-bold">
          {label}: {loading === undefined ? value : <LoadingRegion as="span" loading={loading} name={`filter-${label}-value`} variable skeleton={<SkeletonText width={label === "Section" ? "10ch" : "6ch"} className="inline-block align-top" />}>{value}</LoadingRegion>}
        </span>
        <ChevronDown size={14} className={darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"} />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute right-0 mt-2 min-w-45 rounded-lg overflow-hidden border z-20 shadow-lg ${
            darkMode ? "bg-[#111827] border-[#1F2937]" : "bg-white border-border-subtle"
          }`}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={value === opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
                darkMode ? "hover:bg-[#0B1120]" : "hover:bg-brand-light"
              } ${value === opt ? "text-brand-ink" : darkMode ? "text-white" : "text-[#111827]"}`}
            >
              {opt}
              {value === opt && <Check size={14} className="text-brand-ink" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
