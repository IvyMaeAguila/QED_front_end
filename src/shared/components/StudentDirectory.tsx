import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { StudentDirectoryTable, type StudentDirectoryRow } from "./StudentDirectoryTable";

interface StudentDirectoryProps {
  students: Array<StudentDirectoryRow & { studentId?: string }>;
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  view?: string;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
  onActivate?: (id: string) => void;
}

export function StudentDirectory({ students, panelBg, panelBorder, textPrimary, textMuted, darkMode, onActivate, loading, error, retry, view = "student-directory" }: StudentDirectoryProps) {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<"All" | "Male" | "Female">("All");
  const visibleStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return students
      .filter((student) => {
        if (gender === "All") return true;
        const value = String(student.gender ?? "").toLowerCase();
        return gender === "Male" ? value === "male" || value === "m" : value === "female" || value === "f";
      })
      .filter((student) => !query || `${student.name} ${student.studentId ?? ""}`.toLocaleLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, search, gender]);

  return (
    <div className="flex flex-col gap-4">
      <div className={`flex flex-col gap-2.5 rounded-[12px] border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}>
        <div className="relative w-full sm:w-80">
          <span className="pointer-events-none absolute inset-y-0 z-10 flex items-center pl-2.5 text-gray-400"><Search size={13} /></span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student..."
            aria-label="Search students by name or ID"
            className={`h-8 w-full rounded-lg border pl-8 pr-2.5 text-xs font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${textPrimary} placeholder:text-gray-400 focus:border-maroon`}
          />
        </div>
        <select
          value={gender}
          onChange={(event) => setGender(event.target.value as typeof gender)}
          aria-label="Filter students by gender"
          style={{ borderRadius: "8px" }}
          className={`h-8 rounded-lg border px-2.5 text-xs font-bold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}
        >
          <option value="All">All genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>
      <StudentDirectoryTable
        loading={loading} error={error} retry={retry} view={`${view}:${search}:${gender}`}
        students={visibleStudents}
        totalStudents={students.length}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        onActivate={onActivate}
      />
    </div>
  );
}

