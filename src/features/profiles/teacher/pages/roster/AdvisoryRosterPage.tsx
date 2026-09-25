import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import ExcelJS from "exceljs";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useSelectedAdvisorySection } from "../attendance/services/useSelectedAdvisorySection.service";
import { AdvisorySectionTabs } from "../attendance/components/AdvisorySectionTabs.tsx";
import type { RosterStudent } from "../subjects/detail/data";

import { AdvisorySkeleton } from "./components/AdvisorySkeleton";
import { AdvisoryHeader } from "./components/AdvisoryHeader";
import { AdvisoryTable } from "./components/AdvisoryTable";

type GenderFilter = "All" | "M" | "F";
const ACCENT = "#6B0000";

function sortByName(a: RosterStudent, b: RosterStudent) {
  return a.name.localeCompare(b.name);
}

export function AdvisoryRosterPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();


  const {
    sections,
    section,
    error: sectionError,
    selectSection,
  } = useSelectedAdvisorySection();

  const [genderFilter, setGenderFilter] = useState<GenderFilter>("All");
  const [search, setSearch] = useState("");

  const roster = useMemo(() => {
    if (!section) return [];
    const query = search.trim().toLowerCase();
    return section.roster
      .filter((student) => genderFilter === "All" || student.gender === genderFilter)
      .filter((student) => !query || student.name.toLowerCase().includes(query))
      .sort(sortByName);
  }, [section, genderFilter, search]);

  const handleExport = async () => {
    if (!section) return;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Advisory Roster");
    sheet.columns = [
      { header: "No.", key: "no", width: 6 },
      { header: "Name", key: "name", width: 28 },
      { header: "Gender", key: "gender", width: 10 },
    ];
    sheet.getRow(1).font = { bold: true };
    roster.forEach((student, index) =>
      sheet.addRow({
        no: index + 1,
        name: student.name,
        gender: student.gender === "F" ? "Female" : "Male",
      })
    );
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${section.sectionName || "advisory"}-roster.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const maleCount = section ? section.roster.filter((s) => s.gender === "M").length : 0;
  const femaleCount = section ? section.roster.filter((s) => s.gender === "F").length : 0;

  // sections === undefined -> still loading which classes the teacher has
  if (sections === undefined) {
    return <AdvisorySkeleton darkMode={darkMode} panelBg={panelBg} panelBorder={panelBorder} textMuted={textMuted} />;
  }

  if (sectionError) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 pb-12">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-2 text-sm font-bold ${textMuted}`}>
          Back
        </button>
        <div className={`rounded-2xl border p-8 text-center ${panelBg} ${panelBorder}`}>
          <p className="text-sm font-semibold text-red-500">{sectionError}</p>
        </div>
      </div>
    );
  }

  // sections === null -> confirmed zero advisory classes
  if (!section) {
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
    <div className="max-w-6xl mx-auto space-y-4 pb-12">
      <AdvisoryHeader
        darkMode={darkMode}
        textPrimary={textPrimary}
        textMuted={textMuted}
        gradeLevel={section.gradeLevel}
        sectionName={section.sectionName}
        accentColor={ACCENT}
        totalStudents={section.roster.length}
        maleCount={maleCount}
        femaleCount={femaleCount}
        onBack={() => navigate("/teacher")}
        onExport={handleExport}
        tabs={
          (sections?.length ?? 0) > 1 ? (
            <AdvisorySectionTabs
              sections={sections ?? []}
              activeClassId={section.classId}
              onSelect={selectSection}
              darkMode={darkMode}
              panelBorder={panelBorder}
              textMuted={textMuted}
            />
          ) : undefined
        }
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