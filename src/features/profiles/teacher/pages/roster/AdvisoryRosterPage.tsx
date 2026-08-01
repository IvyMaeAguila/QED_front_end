import { useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, Download, Search, Users } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import ExcelJS from "exceljs";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useStudents } from "../../../admin/pages/studentrecords/context/StudentsContext";
import type { Student } from "../../../admin/pages/studentrecords/types/Students";

type GenderFilter = "All" | "Male" | "Female";

const ADVISORY_GRADE_LEVEL = "Grade 6";
const ADVISORY_SECTION = "A";
const ACCENT = "#6B0000";

const genderAppearance = (gender: Student["gender"]) =>
  gender === "Male"
    ? { color: "#1D70D6", background: "#EAF2FF", initial: "M" }
    : { color: "#C2255C", background: "#FCE7F1", initial: "F" };

function middleInitial(middleName?: string) {
  return middleName ? `${middleName.charAt(0)}.` : "";
}

function sortByName(a: Student, b: Student) {
  return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
}

export function AdvisoryRosterPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { students } = useStudents();
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("All");
  const [search, setSearch] = useState("");

  const advisoryStudents = useMemo(
    () => students.filter((student) => student.gradeLevel === ADVISORY_GRADE_LEVEL && student.section === ADVISORY_SECTION),
    [students]
  );
  const roster = useMemo(() => {
    const query = search.trim().toLowerCase();
    return advisoryStudents
      .filter((student) => genderFilter === "All" || student.gender === genderFilter)
      .filter((student) => {
        const name = `${student.firstName} ${student.middleName ?? ""} ${student.lastName}`.toLowerCase();
        return !query || name.includes(query) || student.id.toLowerCase().includes(query);
      })
      .sort(sortByName);
  }, [advisoryStudents, genderFilter, search]);

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Advisory Roster");
    sheet.columns = [
      { header: "No.", key: "no", width: 6 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "First Name", key: "firstName", width: 20 },
      { header: "M.I.", key: "mi", width: 8 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Student ID", key: "id", width: 16 },
    ];
    sheet.getRow(1).font = { bold: true };
    roster.forEach((student, index) => sheet.addRow({ no: index + 1, lastName: student.lastName, firstName: student.firstName, mi: middleInitial(student.middleName), gender: student.gender, id: student.id }));

    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "advisory-class-roster.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  const maleCount = advisoryStudents.filter((student) => student.gender === "Male").length;
  const femaleCount = advisoryStudents.filter((student) => student.gender === "Female").length;
  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-3">
          <button type="button" onClick={() => navigate("/teacher")} aria-label="Back to teacher dashboard" className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#64748B] hover:bg-[#F6F7FB]"}`}>
            <ArrowLeft size={17} />
          </button>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>Advisory class</p>
            <h1 className={`mt-1 text-3xl font-black tracking-tight ${textPrimary}`}>Class roster</h1>
            <p className={`mt-2 text-sm font-medium ${textMuted}`}>{ADVISORY_GRADE_LEVEL} · Section {ADVISORY_SECTION}</p>
          </div>
        </div>
        <button type="button" onClick={handleExport} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: ACCENT }}>
          <Download size={15} /> Export Excel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total students", value: advisoryStudents.length, color: ACCENT, background: "#F8EDEE" },
          { label: "Male students", value: maleCount, color: "#1D70D6", background: "#EAF2FF" },
          { label: "Female students", value: femaleCount, color: "#C2255C", background: "#FCE7F1" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border p-5" style={{ backgroundColor: darkMode ? `${stat.color}22` : stat.background, borderColor: `${stat.color}45` }}>
            <p className={`text-xs font-bold ${textMuted}`}>{stat.label}</p>
            <p className={`mt-2 text-3xl font-black tabular-nums ${textPrimary}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <section className={cardClasses} aria-label="Advisory class roster">
        <div className={`flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${panelBorder}`}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: ACCENT }}><Users size={18} /></span>
            <div>
              <h2 className={`font-extrabold ${textPrimary}`}>Student directory</h2>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>{roster.length} student{roster.length === 1 ? "" : "s"} shown</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search size={14} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or student ID" className={`h-10 w-full rounded-xl border py-2 pl-9 pr-3 text-xs font-bold outline-none focus:ring-2 sm:w-56 ${panelBg} ${panelBorder} ${textPrimary}`} style={{ "--tw-ring-color": `${ACCENT}55` } as CSSProperties} />
            </div>
            <select value={genderFilter} onChange={(event) => setGenderFilter(event.target.value as GenderFilter)} aria-label="Filter by gender" className={`h-10 rounded-xl border px-3 text-xs font-bold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}>
              <option value="All">All genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        {roster.length === 0 ? (
          <div className="px-5 py-16 text-center"><p className={`font-bold ${textPrimary}`}>No students found</p><p className={`mt-1 text-sm ${textMuted}`}>Try a different name, ID, or gender filter.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-sm">
              <thead><tr className={darkMode ? "bg-white/3" : "bg-[#F8FAFC]"}>
                {['No.', 'Student', 'Student ID', 'Gender'].map((heading) => <th key={heading} className={`px-5 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-wider ${textMuted}`}>{heading}</th>)}
              </tr></thead>
              <tbody>
                {roster.map((student, index) => {
                  const appearance = genderAppearance(student.gender);
                  return (
                    <tr key={student.id} onDoubleClick={() => navigate(`/teacher/students/${student.id}`)} title="Double-click to view student details" className={`cursor-pointer border-t transition-colors ${panelBorder} ${index % 2 === 1 ? (darkMode ? "bg-white/[0.015]" : "bg-black/[0.012]") : ""} ${darkMode ? "hover:bg-white/[0.05]" : "hover:bg-[#FFF8F8]"}`}>
                      <td className={`px-5 py-4 font-bold tabular-nums ${textMuted}`}>{index + 1}</td>
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black" style={{ backgroundColor: darkMode ? `${appearance.color}25` : appearance.background, color: appearance.color }}>{student.firstName.charAt(0)}{student.lastName.charAt(0)}</span><div><p className={`font-extrabold ${textPrimary}`}>{student.lastName}, {student.firstName} {middleInitial(student.middleName)}</p><p className={`mt-0.5 text-xs font-medium ${textMuted}`}>Double-click to open profile</p></div></div></td>
                      <td className={`px-5 py-4 font-extrabold tabular-nums ${textPrimary}`}>{student.id}</td>
                      <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold" style={{ backgroundColor: darkMode ? `${appearance.color}25` : appearance.background, color: appearance.color }}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: appearance.color }} />{student.gender}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
