import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { AccountSelect } from "@shared/components/AccountSelect";


import { Search } from "lucide-react";
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
function Dropdown({value, options, onChange, darkMode}: {value: string; options: Option[]; onChange:(value:string)=>void; darkMode:boolean}) {
 return <AccountSelect role="button" aria-label={options.find(option=>option.value===value)?.label} value={value} onChange={event=>onChange(event.target.value)} data-dropdown-dark={darkMode}>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</AccountSelect>;
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
          className={`qed-filter-control relative w-full pl-8 pr-2.5 rounded-lg border font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${
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
          className={`qed-segmented-control flex h-8 items-center box-border rounded-lg p-0 ${
            darkMode
              ? "bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
              : "bg-gray-50 shadow-[inset_0_0_0_1px_#e5e7eb]"
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
              className={`qed-filter-control px-3 rounded-lg font-semibold transition-colors ${
                groupBySection === opt.value
                  ? "bg-maroon text-white"
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
