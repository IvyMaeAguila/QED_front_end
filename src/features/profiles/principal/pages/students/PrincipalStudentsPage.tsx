import { useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { usePrincipalStudentsOverview } from "./hooks/usePrincipalStudentsOverview";
import { GradeLevelGrid } from "./components/GradeLevelGrid";
import { GradeLevelSearchInput } from "./components/GradeLevelSearchInput";
import { GradeLevelFilterDropdown } from "./components/GradeLevelFilterDropdown";

export function PrincipalStudentsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { gradeLevels, totalStudents, schoolYear, loading, error } =
    usePrincipalStudentsOverview();

  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [sectionFilter, setSectionFilter] = useState("All Sections");

  const gradeOptions = useMemo(() => {
    const grades = Array.from(
      new Set(gradeLevels.map((g) => g.grade).filter(Boolean)),
    ) as string[];
    return ["All Grades", ...grades];
  }, [gradeLevels]);

  const sectionOptions = useMemo(() => {
    const sections = Array.from(
      new Set(gradeLevels.map((g) => g.section).filter(Boolean)),
    ) as string[];
    return ["All Sections", ...sections];
  }, [gradeLevels]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return gradeLevels.filter((g) => {
      if (gradeFilter !== "All Grades" && g.grade !== gradeFilter) return false;
      if (sectionFilter !== "All Sections" && g.section !== sectionFilter)
        return false;
      if (q) {
        const haystack = `${g.grade ?? ""} ${g.section ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [gradeLevels, search, gradeFilter, sectionFilter]);

  const handleViewClassList = (gradeLevel: (typeof gradeLevels)[number]) => {
    if (gradeLevel.classId !== null) {
      navigate(`/principal/students/class/${gradeLevel.classId}`);
    } else {
      navigate(`/principal/students/grade/${gradeLevel.gradeId}`);
    }
  };

  const gridProps = {
    panelBg,
    panelBorder,
    textPrimary,
    textMuted,
    darkMode,
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
          Students
        </h1>
        <p className={`text-sm mt-2 ${textMuted}`}>
          Enrollment overview by grade level &middot; School Year {schoolYear}
        </p>
      </div>

      {/* Search + filters + total + view toggle */}
      <GradeLevelSearchInput
        darkMode={darkMode}
        panelBg={panelBg}
        panelBorder={panelBorder}
        value={search}
        onChange={setSearch}
      >
        <GradeLevelFilterDropdown
          label="Grade level filter"
          value={gradeFilter}
          options={gradeOptions}
          onChange={setGradeFilter}
          darkMode={darkMode}
        />
        {sectionOptions.length > 1 && (
          <GradeLevelFilterDropdown
            label="Section filter"
            value={sectionFilter}
            options={sectionOptions}
            onChange={setSectionFilter}
            darkMode={darkMode}
          />
        )}

        {/* Total students chip */}
        <div
          className={`flex h-8 shrink-0 items-center gap-2 rounded-lg border px-2.5 ${panelBg} ${panelBorder}`}
        >
          <span className={`text-[11px] font-extrabold ${textPrimary}`}>
            {totalStudents.toLocaleString()}
          </span>
          <span className={`text-[11px] font-medium ${textMuted}`}>
            Total Students
          </span>
        </div>

      </GradeLevelSearchInput>

      {loading ? (
        <p className={`py-10 text-center text-xs font-medium ${textMuted}`}>Loading students…</p>
      ) : error ? (
        <p className="py-10 text-center text-xs font-semibold text-red-500">Failed to load students. Please try again.</p>
      ) : filtered.length === 0 ? (
        <p className={`py-10 text-center text-xs font-medium ${textMuted}`}>No grade levels match your search or filters.</p>
      ) : (
        <GradeLevelGrid gradeLevels={filtered} onViewClassList={handleViewClassList} {...gridProps} />
      )}
    </div>
  );
}
