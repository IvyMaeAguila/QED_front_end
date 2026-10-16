import { useMemo,useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { AdvisorySectionTabs } from "../attendance/components/AdvisorySectionTabs.tsx";
import { useSelectedAdvisorySection } from "../attendance/services/useSelectedAdvisorySection.service";
import { normalizeRosterGender,type RosterStudent } from "../subjects/detail/data";

import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { AdvisoryHeader } from "./components/AdvisoryHeader";
import { AdvisoryTable } from "./components/AdvisoryTable";

type GenderFilter = "All" | "M" | "F";
const ACCENT = "var(--color-maroon)";

function sortByName(a: RosterStudent, b: RosterStudent) {
  return a.name.localeCompare(b.name);
}

function useAdvisoryRosterPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();


  const {
    sections,
    section,
    error: sectionError,
    selectSection,
    retry,
    requestedClassId,
  } = useSelectedAdvisorySection();

  const [genderFilter, setGenderFilter] = useState<GenderFilter>("All");
  const [search, setSearch] = useState("");

  const roster = useMemo(() => {
    if (!section) return [];
    const query = search.trim().toLowerCase();
    return section.roster
      .filter((student) => genderFilter === "All" || normalizeRosterGender(student.gender) === genderFilter)
      .filter((student) => !query || student.name.toLowerCase().includes(query))
      .sort(sortByName);
  }, [section, genderFilter, search]);

  const handleExport = async () => {
    if (!section) return;
    const { default: ExcelJSRuntime } = await import("exceljs");
    const workbook = new ExcelJSRuntime.Workbook();
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
        gender:
          normalizeRosterGender(student.gender) === "F"
            ? "Female"
            : normalizeRosterGender(student.gender) === "M"
              ? "Male"
              : "Not specified",
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

  const maleCount = section
    ? section.roster.filter((student) => normalizeRosterGender(student.gender) === "M").length
    : 0;
  const femaleCount = section
    ? section.roster.filter((student) => normalizeRosterGender(student.gender) === "F").length
    : 0;

  const loading = sections === undefined && !sectionError;
  const displaySection = section ?? { classId: "pending", gradeLevel: "", sectionName: "", roster: [] };

  if (sectionError) {
    return { content: ((
      <div className="w-full space-y-6 pb-12">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-2 text-sm font-bold ${textMuted}`} data-sk-region="advisoryrosterpage-back" data-sk-static="">
          Back
        </button>
        <h1 className={`qed-type-page-title ${textPrimary}`} data-sk-region="advisoryrosterpage-class-roster" data-sk-static="">Class Roster</h1>
        <LoadingRegion loading={false} error={sectionError} retry={retry} skeleton={null} className={`rounded-2xl border p-8 text-center ${panelBg} ${panelBorder}`}>{null}</LoadingRegion>
      </div>
    )), scope: {  } };
  }

  // sections === null -> confirmed zero advisory classes
  if (!loading && !section) {
    return { content: ((
      <div className="w-full space-y-6 pb-12">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-2 text-sm font-bold ${textMuted}`} data-sk-region="advisoryrosterpage-back" data-sk-static="">
          Back
        </button>
        <div className={`rounded-2xl border p-8 text-center ${panelBg} ${panelBorder}`}>
          <p className={`text-sm font-semibold ${textPrimary}`} data-sk-region="advisoryrosterpage-you-don-t-have-an-advisory-class-assigned-yet" data-sk-static="">You don't have an advisory class assigned yet.</p>
        </div>
      </div>
    )), scope: {  } };
  }

  return { content: ((
    <div className="w-full space-y-6 pb-12">
      <AdvisoryHeader
        loading={loading}
        darkMode={darkMode}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        gradeLevel={displaySection.gradeLevel}
        sectionName={displaySection.sectionName}
        accentColor={ACCENT}
        totalStudents={displaySection.roster.length}
        maleCount={maleCount}
        femaleCount={femaleCount}
        onBack={() => navigate("/teacher")}
        onExport={handleExport}
        tabs={
          (sections?.length ?? 0) > 1 ? (
            <AdvisorySectionTabs
              sections={sections ?? []}
              activeClassId={displaySection.classId}
              onSelect={selectSection}
              darkMode={darkMode}
              panelBorder={panelBorder}
              textMuted={textMuted}
            />
          ) : undefined
        }
      />

      <AdvisoryTable
        loading={loading} view={`advisory-roster:${requestedClassId ?? "default"}:${genderFilter}:${search}`}
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
  )), scope: {  } };
}


export type AdvisoryRosterPageEffectScope = ReturnType<typeof useAdvisoryRosterPageState>["scope"];
export type AdvisoryRosterPageRouteProps = Record<string, never>;
export function AdvisoryRosterPageComposition(props: object & { effects?: (scope: AdvisoryRosterPageEffectScope) => import("react").ReactNode }) {
 const state = useAdvisoryRosterPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
