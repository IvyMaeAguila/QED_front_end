import { useEffect, useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import { GRADE_LEVELS, type GradeLevel, type SubjectsTheme } from "../types/types";
import { useSections } from "../context/SectionsContext";

type StatusFilter = "all" | "Active" | "Inactive";

interface SubjectFiltersProps extends SubjectsTheme {
  search: string;
  onSearchChange: (value: string) => void;
  teacherFilter: string;
  onTeacherFilterChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  activeGrade: GradeLevel | "all";
  onGradeChange: (grade: GradeLevel | "all") => void;
  activeSection: string | null;
  onSectionChange: (sectionName: string | null) => void;
  groupBySection: boolean;
  onGroupBySectionChange: (value: boolean) => void;
}

interface Option {
  value: string;
  label: string;
}

// Custom dropdown (same look as the Students toolbar) — takes {value,label}
// options so teacher ids can be stored while the teacher name is displayed.
function Dropdown({
  value,
  options,
  onChange,
  darkMode,
}: {
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  darkMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? "";

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className={`h-8 min-w-32 px-3 rounded-lg border text-[11px] font-bold flex items-center justify-between gap-2 transition-colors ${
          darkMode
            ? "bg-[#0B1120] border-[#374151] text-white hover:bg-[#111827]"
            : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] hover:bg-[#F1F5F9]"
        }`}
      >
        <span className="truncate max-w-36">{current}</span>
        <ChevronDown
          size={13}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-9 z-30 w-52 max-h-64 overflow-y-auto rounded-xl border p-1 shadow-lg ${
            darkMode
              ? "bg-[#111827] border-[#374151]"
              : "bg-white border-[#E5E7EB]"
          }`}
        >
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between gap-2 transition-colors ${
                darkMode
                  ? "text-[#D1D5DB] hover:bg-white/10"
                  : "text-[#374151] hover:bg-[#F6F7FB]"
              }`}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && (
                <Check size={14} className="text-[#8B0D0D] shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SubjectFilters({
  darkMode,
  panelBg,
  panelBorder,
  search,
  onSearchChange,
  teacherFilter,
  onTeacherFilterChange,
  statusFilter,
  onStatusFilterChange,
  activeGrade,
  onGradeChange,
  activeSection,
  onSectionChange,
  groupBySection,
  onGroupBySectionChange,
}: SubjectFiltersProps) {
  const { teachers } = useTeachers();
  const { getSectionsForGrade, loadSectionsForGrade } = useSections();

  useEffect(() => {
    if (activeGrade !== "all") void loadSectionsForGrade(activeGrade);
  }, [activeGrade, loadSectionsForGrade]);

  const gradeOptions: Option[] = [
    { value: "all", label: "All Grades" },
    ...GRADE_LEVELS.map((g) => ({ value: g, label: g })),
  ];

  function handleGradeChange(grade: GradeLevel | "all") {
    onSectionChange(null); // reset section filter when switching grade level
    onGradeChange(grade);
  }

  // Sections belong to a single grade, so no section filter for "All Grades".
  const sectionsForActiveGrade =
    activeGrade === "all" ? [] : getSectionsForGrade(activeGrade);
  const sectionOptions: Option[] = [
    { value: "all", label: "All Sections" },
    ...sectionsForActiveGrade.map((s) => ({ value: s.name, label: s.name })),
  ];

  const teacherOptions: Option[] = [
    { value: "all", label: "All Teachers" },
    ...teachers.map((t) => ({ value: t.id, label: formatTeacherName(t) })),
  ];

  const statusOptions: Option[] = [
    { value: "all", label: "All Statuses" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const viewOptions = [
    { label: "By Section", value: true },
    { label: "All", value: false },
  ];

  return (
    <div
      className={`relative z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border px-3 py-2 ${panelBg} ${panelBorder}`}
    >
      <div className="relative w-full sm:w-80">
        <span className="absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 pointer-events-none text-gray-400">
          <Search size={13} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search subject..."
          className={`relative w-full h-8 pl-8 pr-2.5 rounded-lg border text-[11px] font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${
            darkMode ? "text-white" : "text-[#111827]"
          } placeholder:text-gray-400 focus:border-maroon`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Dropdown
          darkMode={darkMode}
          value={activeGrade}
          options={gradeOptions}
          onChange={(v) => handleGradeChange(v as GradeLevel | "all")}
        />
        {sectionsForActiveGrade.length > 0 && (
          <Dropdown
            darkMode={darkMode}
            value={activeSection ?? "all"}
            options={sectionOptions}
            onChange={(v) => onSectionChange(v === "all" ? null : v)}
          />
        )}
        <Dropdown
          darkMode={darkMode}
          value={teacherFilter}
          options={teacherOptions}
          onChange={onTeacherFilterChange}
        />
        <Dropdown
          darkMode={darkMode}
          value={statusFilter}
          options={statusOptions}
          onChange={(v) => onStatusFilterChange(v as StatusFilter)}
        />

        {/* View toggle — group cards by Grade · Section, or show one flat list */}
        <div
          className={`flex items-center rounded-lg border p-0.5 ${
            darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
          }`}
          role="group"
          aria-label="Subject view"
        >
          {viewOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => onGroupBySectionChange(opt.value)}
              aria-pressed={groupBySection === opt.value}
              className={`px-2.5 h-6 rounded-md text-[10px] font-bold transition-colors ${
                groupBySection === opt.value
                  ? "bg-[#800000] text-white"
                  : darkMode
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}