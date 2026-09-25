import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import ExcelJS from "exceljs";
import { ChevronLeft, Download, Loader2, Search, User, Users } from "lucide-react";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import {
  subjectClassListService,
  type SubjectClassListStudent,
} from "./services/subjectClassList.service";

const ACCENT = "#6B0000";

function middleInitial(middleName?: string | null) {
  return middleName ? `${middleName.charAt(0)}.` : "";
}

function sortByName(a: SubjectClassListStudent, b: SubjectClassListStudent) {
  return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
}

export function SubjectClassListPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { subjectSectionId } = useParams<{ subjectSectionId: string }>();

  const [subjectName, setSubjectName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [students, setStudents] = useState<SubjectClassListStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!subjectSectionId) return;
    setLoading(true);
    subjectClassListService
      .getClassList(Number(subjectSectionId))
      .then((result) => {
        setSubjectName(result.subjectName);
        setGradeLevel(result.gradeLevel);
        setSectionName(result.sectionName);
        setStudents(result.students);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load class list:", err);
        setError("Failed to load this class list.");
      })
      .finally(() => setLoading(false));
  }, [subjectSectionId]);

  const matchesSearch = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (s: SubjectClassListStudent) => {
      const name = `${s.firstName} ${s.middleName ?? ""} ${s.lastName}`.toLowerCase();
      return !query || name.includes(query) || s.studentNumber.toLowerCase().includes(query);
    };
  }, [search]);

  const maleRoster = useMemo(
    () => students.filter((s) => s.gender === "Male").filter(matchesSearch).sort(sortByName),
    [students, matchesSearch]
  );

  const femaleRoster = useMemo(
    () => students.filter((s) => s.gender === "Female").filter(matchesSearch).sort(sortByName),
    [students, matchesSearch]
  );

  const maleCount = students.filter((s) => s.gender === "Male").length;
  const femaleCount = students.filter((s) => s.gender === "Female").length;
  const filteredCount = maleRoster.length + femaleRoster.length;

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const displaySectionName = sectionName ? `${gradeLevel} · Section ${sectionName}` : gradeLevel;

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Class List");
    sheet.columns = [
      { header: "No.", key: "no", width: 6 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "First Name", key: "firstName", width: 20 },
      { header: "M.I.", key: "mi", width: 8 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Student ID", key: "id", width: 16 },
    ];
    sheet.getRow(1).font = { bold: true };

    const exportRoster = [...maleRoster, ...femaleRoster];
    exportRoster.forEach((s, index) =>
      sheet.addRow({
        no: index + 1,
        lastName: s.lastName,
        firstName: s.firstName,
        mi: middleInitial(s.middleName),
        gender: s.gender,
        id: s.studentNumber,
      })
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${subjectName || "class"}-roster.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  function renderStudentRow(student: SubjectClassListStudent, index: number) {
    return (
      <tr
        key={student.studentId}
        className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}
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
            <span className={`truncate text-xs font-bold ${textPrimary}`}>
              {student.lastName}, {student.firstName} {middleInitial(student.middleName)}
            </span>
          </div>
        </td>
        <td className={`px-4 py-2 text-xs font-medium tabular-nums ${textMuted}`}>
          {student.studentNumber}
        </td>
      </tr>
    );
  }

  return (
    <div className="w-full min-h-full pb-12">
      <div className="w-full px-6 lg:px-8 pt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className={`mt-1 shrink-0 ${textMuted}`}
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <p
                className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
                style={{ color: ACCENT }}
              >
                {displaySectionName}
              </p>
              <h1 className={`mt-1 text-xl font-black tracking-tight ${textPrimary}`}>
                {subjectName || "Class List"}
              </h1>
              <p className={`mt-1 text-xs font-medium ${textMuted}`}>
                {students.length} student{students.length === 1 ? "" : "s"} · {maleCount} male ·{" "}
                {femaleCount} female
              </p>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={loading || !!error || students.length === 0}
            className={`flex h-8 shrink-0 items-center gap-1.5 self-start rounded-lg border bg-[#800000] px-3 text-[11px] font-extrabold text-white transition-colors hover:bg-[#650000] disabled:opacity-40 sm:self-center ${
              darkMode ? "border-white/10" : "border-black/10"
            }`}
          >
            <Download size={12} />
            Export to Excel
          </button>
        </div>

        {error ? (
          <div className={`${cardClasses} px-5 py-14 text-center`}>
            <p className="text-xs font-semibold text-red-500">{error}</p>
          </div>
        ) : loading ? (
          <div className={`${cardClasses} flex items-center justify-center gap-2 px-5 py-14`}>
            <Loader2 size={15} className={`animate-spin ${textMuted}`} />
            <p className={`text-xs font-semibold ${textMuted}`}>Loading class list...</p>
          </div>
        ) : (
          <>
            <div
              className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}
            >
              <div className="relative w-full sm:w-72">
                <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 text-gray-400">
                  <Search size={13} />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student..."
                  aria-label="Search student by name or ID"
                  className={`h-8 w-full rounded-lg border pl-8 pr-2.5 text-[11px] font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-maroon ${panelBg} ${panelBorder} ${textPrimary}`}
                />
              </div>
              <p className={`text-[11px] font-bold ${textMuted}`}>
                Showing {filteredCount} of {students.length}
              </p>
            </div>

            <div className={cardClasses}>
              <div
                className={`flex items-center gap-1.5 border-b px-4 py-2.5 ${panelBorder}`}
              >
                <Users size={13} style={{ color: ACCENT }} />
                <p className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>
                  Class List
                </p>
              </div>

              {filteredCount === 0 ? (
                <p className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>
                  No students found matching "{search}".
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
                        <th
                          className={`px-4 py-2 text-left text-[11px] font-black uppercase tracking-wider ${textMuted}`}
                        >
                          Student ID
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {maleRoster.length > 0 && (
                        <>
                          <tr>
                            <td
                              colSpan={3}
                              className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                                darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
                              } ${textPrimary}`}
                            >
                              Male
                            </td>
                          </tr>
                          {maleRoster.map((s, i) => renderStudentRow(s, i))}
                        </>
                      )}

                      {femaleRoster.length > 0 && (
                        <>
                          <tr>
                            <td
                              colSpan={3}
                              className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                                darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
                              } ${textPrimary}`}
                            >
                              Female
                            </td>
                          </tr>
                          {femaleRoster.map((s, i) => renderStudentRow(s, i))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}