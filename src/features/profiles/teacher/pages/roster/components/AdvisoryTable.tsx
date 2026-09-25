import { Search, User, Users } from "lucide-react";
import type { RosterStudent } from "../../subjects/detail/data";

type GenderFilter = "All" | "M" | "F";

function isFemale(student: RosterStudent): boolean {
  const g = String(student.gender ?? "").trim().toUpperCase();
  return g === "F" || g === "FEMALE";
}

interface AdvisoryTableProps {
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
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  roster,
  search,
  setSearch,
  genderFilter,
  setGenderFilter,
  accentColor,
  onRowDoubleClick,
}: AdvisoryTableProps) {
  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;

  const maleRoster = roster.filter((s) => !isFemale(s));
  const femaleRoster = roster.filter((s) => isFemale(s));

  function renderRow(student: RosterStudent, index: number) {
    return (
      <tr
        key={student.id}
        onDoubleClick={() => onRowDoubleClick(student.id)}
        title="Double-click to view student details"
        className={`cursor-pointer border-t transition-colors ${panelBorder} ${
          darkMode ? "hover:bg-white/5" : "hover:bg-black/1.5"
        }`}
      >
        <td className={`px-4 py-2 text-[11px] font-bold tabular-nums ${textMuted}`}>{index + 1}</td>
        <td className="px-4 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                darkMode ? "bg-white/10" : "bg-black/5"
              } ${textMuted}`}
            >
              <User size={13} />
            </span>
            <span className={`truncate text-xs font-bold ${textPrimary}`}>{student.name}</span>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <div
        className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}
      >
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 pointer-events-none text-gray-400">
            <Search size={13} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student..."
            aria-label="Search student by name"
            className={`w-full h-8 pl-8 pr-2.5 rounded-lg border text-[11px] font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${textPrimary} placeholder:text-gray-400 focus:border-maroon`}
          />
        </div>
        <select
          value={genderFilter}
          onChange={(event) => setGenderFilter(event.target.value as GenderFilter)}
          aria-label="Filter by gender"
          className={`h-8 rounded-lg border px-2.5 text-[11px] font-bold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}
        >
          <option value="All">All genders</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </div>

      <section className={cardClasses} aria-label="Advisory class roster">
        <div className={`flex items-center gap-1.5 border-b px-4 py-2.5 ${panelBorder}`}>
          <Users size={13} style={{ color: accentColor }} />
          <p className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>
            Student directory
          </p>
          <span className={`ml-auto text-[11px] font-bold ${textMuted}`}>{roster.length} shown</span>
        </div>

        {roster.length === 0 ? (
          <p className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>
            No students found{search ? ` matching "${search}"` : ""}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
                  <th
                    className={`w-12 px-4 py-2 text-left text-[11px] font-black uppercase tracking-wider ${textMuted}`}
                  >
                    No.
                  </th>
                  <th
                    className={`px-4 py-2 text-left text-[11px] font-black uppercase tracking-wider ${textMuted}`}
                  >
                    Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {maleRoster.length > 0 && (
                  <>
                    <tr>
                      <td
                        colSpan={2}
                        className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                          darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
                        } ${textPrimary}`}
                      >
                        Male
                      </td>
                    </tr>
                    {maleRoster.map((s, i) => renderRow(s, i))}
                  </>
                )}

                {femaleRoster.length > 0 && (
                  <>
                    <tr>
                      <td
                        colSpan={2}
                        className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                          darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
                        } ${textPrimary}`}
                      >
                        Female
                      </td>
                    </tr>
                    {femaleRoster.map((s, i) => renderRow(s, i))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}