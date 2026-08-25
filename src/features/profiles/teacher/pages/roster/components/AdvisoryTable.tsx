import type { CSSProperties } from "react";
import { Search, Users } from "lucide-react";
import type { AdvisoryStudent } from "../services/advisory.service";

type GenderFilter = "All" | "Male" | "Female";

interface AdvisoryTableProps {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  roster: AdvisoryStudent[];
  search: string;
  setSearch: (val: string) => void;
  genderFilter: GenderFilter;
  setGenderFilter: (val: GenderFilter) => void;
  accentColor: string;
  onRowDoubleClick: (studentId: string | number) => void;
}

const genderAppearance = (gender: AdvisoryStudent["gender"]) =>
  gender === "Male"
    ? { color: "#1D70D6", background: "#EAF2FF" }
    : { color: "#C2255C", background: "#FCE7F1" };

function middleInitial(middleName?: string | null) {
  return middleName ? `${middleName.charAt(0)}.` : "";
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
  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;

  return (
    <section className={cardClasses} aria-label="Advisory class roster">
      <div className={`flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${panelBorder}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: accentColor }}>
            <Users size={18} />
          </span>
          <div>
            <h2 className={`font-extrabold ${textPrimary}`}>Student directory</h2>
            <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
              {roster.length} student{roster.length === 1 ? "" : "s"} shown
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search size={14} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or student ID"
              className={`h-10 w-full rounded-xl border py-2 pl-9 pr-3 text-xs font-bold outline-none focus:ring-2 sm:w-56 ${panelBg} ${panelBorder} ${textPrimary}`}
              style={{ "--tw-ring-color": `${accentColor}55` } as CSSProperties}
            />
          </div>
          <select
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value as GenderFilter)}
            aria-label="Filter by gender"
            className={`h-10 rounded-xl border px-3 text-xs font-bold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}
          >
            <option value="All">All genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      {roster.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className={`font-bold ${textPrimary}`}>No students found</p>
          <p className={`mt-1 text-sm ${textMuted}`}>Try a different name, ID, or gender filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-sm">
            <thead>
              <tr className={darkMode ? "bg-white/3" : "bg-[#F8FAFC]"}>
                {["No.", "Student", "Student ID", "Gender"].map((heading) => (
                  <th key={heading} className={`px-5 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-wider ${textMuted}`}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roster.map((student, index) => {
                const appearance = genderAppearance(student.gender);
                return (
                  <tr
                    key={student.id}
                    onDoubleClick={() => onRowDoubleClick(student.id)}
                    title="Double-click to view student details"
                    className={`cursor-pointer border-t transition-colors ${panelBorder} ${
                      index % 2 === 1 ? (darkMode ? "bg-white/1.5" : "bg-black/[0.012]") : ""
                    } ${darkMode ? "hover:bg-white/5" : "hover:bg-[#FFF8F8]"}`}
                  >
                    <td className={`px-5 py-4 font-bold tabular-nums ${textMuted}`}>{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black"
                          style={{
                            backgroundColor: darkMode ? `${appearance.color}25` : appearance.background,
                            color: appearance.color,
                          }}
                        >
                          {student.first_name.charAt(0)}
                          {student.last_name.charAt(0)}
                        </span>
                        <div>
                          <p className={`font-extrabold ${textPrimary}`}>
                            {student.last_name}, {student.first_name} {middleInitial(student.middle_name)}
                          </p>
                          <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>Double-click to open profile</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-5 py-4 font-extrabold tabular-nums ${textPrimary}`}>{student.student_number}</td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold"
                        style={{
                          backgroundColor: darkMode ? `${appearance.color}25` : appearance.background,
                          color: appearance.color,
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: appearance.color }} />
                        {student.gender}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}