import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import ExcelJS from "exceljs";
import { ArrowLeft, Search, Users } from "lucide-react";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import {
  subjectClassListService,
  type SubjectClassListStudent,
} from "./services/subjectClassList.service";

const ACCENT = "#6B0000";
const SYSTEM_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

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

  const inputBg = darkMode ? "bg-white/[0.06]" : "bg-black/[0.03]";
  const cardClasses = `rounded-[28px] border ${panelBg} ${panelBorder}`;

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

  if (loading) {
    return (
      <div className="space-y-8 pb-16" style={{ fontFamily: SYSTEM_FONT }}>
        <div className={`h-40 rounded-[28px] border animate-pulse ${panelBg} ${panelBorder}`} />
        <div className={`h-64 rounded-[28px] border animate-pulse ${panelBg} ${panelBorder}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 pb-16" style={{ fontFamily: SYSTEM_FONT }}>
        <button onClick={() => navigate(-1)} className={`flex items-center gap-2 text-sm font-semibold ${textMuted}`}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className={`${cardClasses} py-16 text-center`}>
          <p className="text-[13px] font-medium text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const renderRosterTable = (label: string, roster: SubjectClassListStudent[]) => (
    <div className={cardClasses}>
      <div className={`px-6 py-4 border-b ${panelBorder}`}>
        <p className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: ACCENT }}>
          {label} ({roster.length})
        </p>
      </div>
      <div className="p-6 pt-0">
        <table
          className={`w-full text-left border-collapse border ${panelBorder}`}
        >
          <thead>
            <tr className={darkMode ? "bg-white/4" : "bg-black/2"}>
              <th className={`border ${panelBorder} px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide ${textMuted} w-12`}>
                No.
              </th>
              <th className={`border ${panelBorder} px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>
                Name
              </th>
              <th className={`border ${panelBorder} px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>
                Student ID
              </th>
            </tr>
          </thead>
          <tbody>
            {roster.map((s, i) => (
              <tr key={s.studentId}>
                <td className={`border ${panelBorder} px-4 py-2.5 text-[13px] ${textMuted}`}>{i + 1}</td>
                <td className={`border ${panelBorder} px-4 py-2.5 text-[13px] font-medium ${textPrimary}`}>
                  {s.lastName}, {s.firstName} {middleInitial(s.middleName)}
                </td>
                <td className={`border ${panelBorder} px-4 py-2.5 text-[13px] ${textMuted}`}>{s.studentNumber}</td>
              </tr>
            ))}
            {roster.length === 0 && (
              <tr>
                <td colSpan={3} className={`border ${panelBorder} px-4 py-8 text-center text-[13px] font-medium ${textMuted}`}>
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-16" style={{ fontFamily: SYSTEM_FONT }}>
      <button onClick={() => navigate(-1)} className={`flex items-center gap-2 text-sm font-semibold ${textMuted}`}>
        <ArrowLeft size={16} /> Back to Subjects
      </button>

      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] mb-3" style={{ color: ACCENT }}>
          {gradeLevel}
          {sectionName && ` · Section ${sectionName}`}
        </p>
        <h1 className={`text-[40px] sm:text-[48px] leading-[1.05] font-semibold tracking-tight ${textPrimary}`}>
          {subjectName}
        </h1>
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-6 border-y ${panelBorder} py-8`}>
        <div className="flex flex-wrap gap-x-12 gap-y-6">
          <div className="min-w-30">
            <div className={`flex items-center gap-2 text-[13px] font-medium ${textMuted}`}>
              <Users size={14} style={{ color: ACCENT }} />
              Total Students
            </div>
            <p className={`text-4xl font-semibold tracking-tight mt-1 ${textPrimary}`}>{students.length}</p>
          </div>
          <div className="min-w-30">
            <div className={`text-[13px] font-medium ${textMuted}`}>Male</div>
            <p className={`text-4xl font-semibold tracking-tight mt-1 ${textPrimary}`}>{maleCount}</p>
          </div>
          <div className="min-w-30">
            <div className={`text-[13px] font-medium ${textMuted}`}>Female</div>
            <p className={`text-4xl font-semibold tracking-tight mt-1 ${textPrimary}`}>{femaleCount}</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="h-11 px-6 rounded-full text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          Export to Excel
        </button>
      </div>

      <div className="relative flex-1 min-w-55 max-w-xs">
        <Search size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textMuted}`} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student"
          className={`h-11 pl-10 pr-4 w-full text-[13px] font-medium rounded-full border outline-none transition focus:ring-2 ${inputBg} ${panelBorder} ${textPrimary}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {renderRosterTable("Male", maleRoster)}
        {renderRosterTable("Female", femaleRoster)}
      </div>
    </div>
  );
}