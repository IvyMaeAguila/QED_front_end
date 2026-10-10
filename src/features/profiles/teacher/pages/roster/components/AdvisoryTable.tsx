import { Search } from "lucide-react";
import { StudentDirectoryTable } from "@shared/components/StudentDirectoryTable";
import { type RosterStudent } from "../../subjects/detail/data";

type GenderFilter = "All" | "M" | "F";

interface AdvisoryTableProps {
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  view?: string;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  roster: RosterStudent[];
  search: string;
  setSearch: (val: string) => void;
  genderFilter: GenderFilter;
  setGenderFilter: (val: GenderFilter) => void;
  accentColor: string;
  onRowDoubleClick: (studentId: string) => void;
}

export function AdvisoryTable({
  loading = false, error, retry, view,
  darkMode, panelBg, panelBorder, textPrimary, textMuted, roster, search,
  setSearch, genderFilter, setGenderFilter, onRowDoubleClick,
}: AdvisoryTableProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className={`flex flex-col gap-2.5 rounded-[12px] border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}>
        <div className="relative w-full sm:w-80">
          <span className="pointer-events-none absolute inset-y-0 z-10 flex items-center pl-2.5 text-gray-400"><Search size={13} /></span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student..."
            aria-label="Search student by name"
            className={`h-8 w-full rounded-lg border pl-8 pr-2.5 text-xs font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${textPrimary} placeholder:text-gray-400 focus:border-maroon`}
          />
        </div>
        <select
          value={genderFilter}
          onChange={(event) => setGenderFilter(event.target.value as GenderFilter)}
          aria-label="Filter by gender"
          style={{ borderRadius: "8px" }}
          className={`h-8 rounded-lg border px-2.5 text-xs font-bold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}
        >
          <option value="All">All genders</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </div>
      <StudentDirectoryTable
        loading={loading} error={error} retry={retry} view={view}
        students={roster.map((student) => ({ id: student.id, name: student.name, gender: student.gender }))}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        onActivate={onRowDoubleClick}
        activateOnDoubleClick
        activationHint="Double-click to view student details"
      />
    </div>
  );
}
