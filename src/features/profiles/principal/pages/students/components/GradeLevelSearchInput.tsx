import { Search } from "lucide-react";
import type { ReactNode } from "react";

interface GradeLevelSearchInputProps {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  children?: ReactNode;
}

export function GradeLevelSearchInput({
  darkMode,
  panelBg,
  panelBorder,
  value,
  onChange,
  placeholder = "Search grade or section...",
  children,
}: GradeLevelSearchInputProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border px-3 py-2 ${panelBg} ${panelBorder}`}
    >
      <div className="relative w-full sm:w-80">
        <span className="absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 pointer-events-none text-gray-400">
          <Search size={13} />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`relative w-full h-8 pl-8 pr-2.5 rounded-lg border text-xs font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${
            darkMode ? "text-white" : "text-[#111827]"
          } placeholder:text-gray-400 focus:border-maroon`}
        />
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2.5">{children}</div>
      )}
    </div>
  );
}