import { Search, ChevronDown } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import type { SubjectsTheme } from "../types/types";

interface SubjectFiltersProps extends SubjectsTheme {
  search: string;
  onSearchChange: (value: string) => void;
  teacherFilter: string;
  onTeacherFilterChange: (value: string) => void;
  statusFilter: "all" | "Active" | "Inactive";
  onStatusFilterChange: (value: "all" | "Active" | "Inactive") => void;
}

export function SubjectFilters({
  darkMode,
  search,
  onSearchChange,
  teacherFilter,
  onTeacherFilterChange,
  statusFilter,
  onStatusFilterChange,
  textMuted,
}: SubjectFiltersProps) {
  const { teachers } = useTeachers();

  const inputClasses = `h-10 pl-9 pr-3 rounded-xl border text-sm font-semibold outline-none transition-colors w-full ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const selectClasses = `h-10 pl-3 pr-8 rounded-xl border text-sm font-semibold outline-none appearance-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-55">
        <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search subject…"
          className={inputClasses}
        />
      </div>

      <div className="relative">
        <select
          value={teacherFilter}
          onChange={(e) => onTeacherFilterChange(e.target.value)}
          className={selectClasses}
        >
          <option value="all">All Teachers</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {formatTeacherName(t)}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
      </div>

      <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as "all" | "Active" | "Inactive")}
          className={selectClasses}
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <ChevronDown size={14} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
      </div>
    </div>
  );
}