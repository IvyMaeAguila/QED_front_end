import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Filter as FilterIcon } from "lucide-react";

interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  darkMode: boolean;
}

// Custom-built dropdown per design spec (native <select> styling is not used).
// Check icon marks the selected option in accent color (#8B0D0D).
export function FilterDropdown({
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`h-9 px-4 rounded-xl flex items-center gap-2 border transition-colors ${
          darkMode
            ? "bg-[#111827] border-[#1F2937] text-white hover:border-[#374151]"
            : "bg-white border-[#E5E7EB] text-[#111827] hover:border-[#8B0D0D]"
        }`}
      >
        <FilterIcon size={14} className={darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"} />
        <span className="text-xs font-bold">
          {label}: {value}
        </span>
        <ChevronDown size={14} className={darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"} />
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 min-w-[180px] rounded-xl overflow-hidden border z-20 shadow-lg ${
            darkMode ? "bg-[#111827] border-[#1F2937]" : "bg-white border-[#E5E7EB]"
          }`}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
                darkMode ? "hover:bg-[#0B1120]" : "hover:bg-[#F6F7FB]"
              } ${value === opt ? "text-[#8B0D0D]" : darkMode ? "text-white" : "text-[#111827]"}`}
            >
              {opt}
              {value === opt && <Check size={14} className="text-[#8B0D0D]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}