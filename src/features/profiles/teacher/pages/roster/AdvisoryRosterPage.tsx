import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import ExcelJS from "exceljs";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { fetchAdvisoryRoster, type AdvisoryStudent } from "./services/advisory.service";

import { AdvisorySkeleton } from "./components/AdvisorySkeleton";
import { AdvisoryHeader } from "./components/AdvisoryHeader";
import { AdvisoryStats } from "./components/AdvisoryStats";
import { AdvisoryTable } from "./components/AdvisoryTable";

type GenderFilter = "All" | "Male" | "Female";
const ACCENT = "#6B0000";

function middleInitial(middleName?: string | null) {
  return middleName ? `${middleName.charAt(0)}.` : "";
}

function sortByName(a: AdvisoryStudent, b: AdvisoryStudent) {
  return a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name);
}

export function AdvisoryRosterPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const [students, setStudents] = useState<AdvisoryStudent[]>([]);
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchAdvisoryRoster()
      .then((result) => {
        setGradeLevel(result.gradeLevel);
        setSectionName(result.sectionName);
        setStudents(result.students);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load advisory roster:", err);
        setError("Failed to load your advisory class.");
      })
      .finally(() => setLoading(false));
  }, []);

  const roster = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students
      .filter((student) => genderFilter === "All" || student.gender === genderFilter)
      .filter((student) => {
        const name = `${student.first_name} ${student.middle_name ?? ""} ${student.last_name}`.toLowerCase();
        return !query || name.includes(query) || student.student_number.toLowerCase().includes(query);
      })
      .sort(sortByName);
  }, [students, genderFilter, search]);

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
    roster.forEach((student, index) =>
      sheet.addRow({
        no: index + 1,
        lastName: student.last_name,
        firstName: student.first_name,
        mi: middleInitial(student.middle_name),
        gender: student.gender,
        id: student.student_number,
      })
    );
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "advisory-class-roster.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  const maleCount = students.filter((s) => s.gender === "Male").length;
  const femaleCount = students.filter((s) => s.gender === "Female").length;

  if (loading) {
    return <AdvisorySkeleton darkMode={darkMode} panelBg={panelBg} panelBorder={panelBorder} textMuted={textMuted} />;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 pb-12">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-2 text-sm font-bold ${textMuted}`}>
          Back
        </button>
        <div className={`rounded-2xl border p-8 text-center ${panelBg} ${panelBorder}`}>
          <p className="text-sm font-semibold text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!gradeLevel || !sectionName) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 pb-12">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-2 text-sm font-bold ${textMuted}`}>
          Back
        </button>
        <div className={`rounded-2xl border p-8 text-center ${panelBg} ${panelBorder}`}>
          <p className={`text-sm font-semibold ${textPrimary}`}>You don't have an advisory class assigned yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <AdvisoryHeader
        darkMode={darkMode}
        textPrimary={textPrimary}
        textMuted={textMuted}
        gradeLevel={gradeLevel}
        sectionName={sectionName}
        accentColor={ACCENT}
        onBack={() => navigate("/teacher")}
        onExport={handleExport}
      />

      <AdvisoryStats
        darkMode={darkMode}
        textPrimary={textPrimary}
        textMuted={textMuted}
        totalStudents={students.length}
        maleCount={maleCount}
        femaleCount={femaleCount}
        accentColor={ACCENT}
      />

      <AdvisoryTable
        darkMode={darkMode}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        roster={roster}
        search={search}
        setSearch={setSearch}
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
        accentColor={ACCENT}
        onRowDoubleClick={(id) => navigate(`/teacher/students/${id}`)}
      />
    </div>
  );
}