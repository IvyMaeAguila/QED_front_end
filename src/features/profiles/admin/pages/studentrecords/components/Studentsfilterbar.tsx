import { useState } from "react";
import { ChevronDown, Check, Search, UserPlus } from "lucide-react";
import { GRADE_LEVELS, GENDERS, type Gender, type GradeLevel } from "../types/Students";

interface StudentsFilterBarProps {
  darkMode: boolean;
  panelBorder: string;
  gradeFilter: GradeLevel | "All Grades";
  genderFilter: Gender | "All Genders";
  search: string;
  onGradeChange: (value: GradeLevel | "All Grades") => void;
  onGenderChange: (value: Gender | "All Genders") => void;
  onSearchChange: (value: string) => void;
  onAddNew: () => void;
}

function Dropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  darkMode,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
  darkMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`h-9 min-w-35 px-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-colors ${
          darkMode
            ? "bg-[#0B1120] border-[#374151] text-white hover:bg-[#111827]"
            : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] hover:bg-[#F1F5F9]"
        }`}
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-11 z-30 w-44 rounded-xl border p-1 shadow-lg ${
            darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-[#E5E7EB]"
          }`}
        >
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#374151] hover:bg-[#F6F7FB]"
              }`}
            >
              {option}
              {value === option && <Check size={14} className="text-[#8B0D0D]" />}
            </button>
          ))}
        </div>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function StudentsFilterBar({
  darkMode,
  panelBorder,
  gradeFilter,
  genderFilter,
  search,
  onGradeChange,
  onGenderChange,
  onSearchChange,
  onAddNew,
}: StudentsFilterBarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 px-5 py-4 border-b ${panelBorder}`}>
      <div className="relative flex-1 min-w-45">
        <Search
          size={15}
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name or student ID..."
          className={`w-full h-9 pl-9 pr-3 rounded-xl border text-xs font-semibold outline-none transition-colors ${
            darkMode
              ? "bg-[#0B1120] border-[#374151] text-white placeholder:text-[#6B7280] focus:border-[#8B0D0D]"
              : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#8B0D0D]"
          }`}
        />
      </div>

      <Dropdown
        label="Grade level filter"
        value={gradeFilter}
        options={["All Grades", ...GRADE_LEVELS]}
        onChange={onGradeChange}
        darkMode={darkMode}
      />

      <Dropdown
        label="Gender filter"
        value={genderFilter}
        options={["All Genders", ...GENDERS]}
        onChange={onGenderChange}
        darkMode={darkMode}
      />

      <button
        onClick={onAddNew}
        className="h-9 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-2 shrink-0 transition-colors hover:bg-[#6B0000]"
        style={{ background: "#8B0D0D" }}
      >
        <UserPlus size={15} />
        Add New Student
      </button>
    </div>
  );
}