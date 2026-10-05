import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { usePrincipalGradebooks } from "./hooks/usePrincipalGradebooks";
import { DashboardStatus } from "./components/DashboardStatus";
import { GradebooksHeader } from "./components/GradebooksHeader";
import { GradeLevelCards } from "./components/GradeLevelCards";
import { Skeleton } from "@shared/components/SkeletonLoading";
import { GradeLevelSearchInput } from "../students/components/GradeLevelSearchInput";
import { GradeLevelFilterDropdown } from "../students/components/GradeLevelFilterDropdown";

type GroupMode = "grade" | "all";

function GradebooksSkeleton() {
  return (
    <div className="flex flex-col gap-4 mt-1">
      <Skeleton className="h-3 w-40 ml-8" />
      <Skeleton className="h-3 w-40 ml-8 mb-7" />
      <div className="flex gap-4">
        <Skeleton className="h-78 w-180 rounded-4xl" />
        <Skeleton className="h-78 w-180 rounded-4xl" />
        <Skeleton className="h-78 w-180 rounded-4xl" />
      </div>
      <div className="flex gap-4 mt-1">
        <Skeleton className="h-78 w-180 rounded-4xl" />
        <Skeleton className="h-78 w-180 rounded-4xl" />
        <Skeleton className="h-78 w-180 rounded-4xl" />
      </div>
    </div>
  );
}

export function PrincipalGradebooksPage() {
  const theme = useOutletContext<AdminThemeContext>();
  const { panelBg, panelBorder, textPrimary, textMuted } = theme;
  const navigate = useNavigate();

  const { gradeLevels, schoolYear, loading, error } =
    usePrincipalGradebooks();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [sectionFilter, setSectionFilter] = useState("All Sections");
  const [groupMode, setGroupMode] = useState<GroupMode>("grade");

  const gradeOptions = useMemo(() => [
    "All Grades",
    ...Array.from(new Set(gradeLevels.map((item) => item.grade).filter(Boolean))),
  ], [gradeLevels]);
  const sectionOptions = useMemo(() => [
    "All Sections",
    ...Array.from(new Set(gradeLevels.map((item) => item.section).filter(Boolean))),
  ], [gradeLevels]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return gradeLevels.filter((item) => {
      if (gradeFilter !== "All Grades" && item.grade !== gradeFilter) return false;
      if (sectionFilter !== "All Sections" && item.section !== sectionFilter) return false;
      return !query || `${item.grade} ${item.section}`.toLowerCase().includes(query);
    });
  }, [gradeLevels, gradeFilter, sectionFilter, search]);
  const groups = useMemo(() => {
    const byGroup = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const key = item.grade;
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key)!.push(item);
    }
    return Array.from(byGroup.entries()).sort(([left], [right]) =>
      left.localeCompare(right, undefined, { numeric: true }),
    );
  }, [filtered]);

  const toggleClass = (active: boolean) =>
    `qed-segmented-control__item rounded-lg px-3 text-[11px] font-semibold transition-colors ${active ? "bg-[#800000] text-white" : `${textMuted} ${theme.darkMode ? "hover:text-white" : "hover:text-gray-700"}`}`;

  if (loading) {
    return <GradebooksSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <GradebooksHeader
        schoolYear={schoolYear}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />

      {error ? (
        <DashboardStatus
          loading={false}
          error={error}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textMuted={textMuted}
        />
      ) : (
        <>
          <GradeLevelSearchInput
            darkMode={theme.darkMode}
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
              darkMode={theme.darkMode}
            />
            <GradeLevelFilterDropdown
              label="Section filter"
              value={sectionFilter}
              options={sectionOptions}
              onChange={setSectionFilter}
              darkMode={theme.darkMode}
            />
            <div
              className={`qed-segmented-control flex items-center rounded-lg p-0 ${theme.darkMode ? "bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" : "bg-gray-50 shadow-[inset_0_0_0_1px_#e5e7eb]"}`}
              role="group"
              aria-label="Gradebook view"
            >
              <button type="button" onClick={() => setGroupMode("grade")} aria-pressed={groupMode === "grade"} className={toggleClass(groupMode === "grade")}>By Grade Level</button>
              <button type="button" onClick={() => setGroupMode("all")} aria-pressed={groupMode === "all"} className={toggleClass(groupMode === "all")}>All</button>
            </div>
          </GradeLevelSearchInput>

          <div className={`rounded-2xl border shadow-card ${panelBg} ${panelBorder}`}>
            {filtered.length === 0 ? (
              <p className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>
                No gradebooks match your search or filters.
              </p>
            ) : groupMode === "all" ? (
              <div className="p-4">
                <GradeLevelCards
                  gradeLevels={filtered}
                  schoolYear={schoolYear}
                  darkMode={theme.darkMode}
                  panelBg={panelBg}
                  panelBorder={panelBorder}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  onSelectGrade={selectGrade}
                />
              </div>
            ) : (
              <div className="space-y-7 p-4">
                {groups.map(([label, items]) => (
                  <section key={label}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-5 w-1 rounded-full bg-[#800000]" />
                      <h2 className={`text-xs font-extrabold uppercase tracking-wide ${textPrimary}`}>
                        {label}
                      </h2>
                      <span className={`h-px flex-1 ${theme.darkMode ? "bg-white/10" : "bg-gray-200"}`} />
                    </div>
                    <GradeLevelCards
                      gradeLevels={items}
                      schoolYear={schoolYear}
                      darkMode={theme.darkMode}
                      panelBg={panelBg}
                      panelBorder={panelBorder}
                      textPrimary={textPrimary}
                      textMuted={textMuted}
                      onSelectGrade={selectGrade}
                    />
                  </section>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  function selectGrade(summary: (typeof gradeLevels)[number]) {
    if (!summary.isSubmitted || summary.gradingPeriodId === null) return;

    const params = new URLSearchParams({
      gradeLevelId: String(summary.gradeLevelId),
      gradingPeriodId: String(summary.gradingPeriodId),
    });
    if (summary.sectionId) params.set("sectionId", String(summary.sectionId));

    navigate(`/principal/gradebooks/${encodeURIComponent(summary.grade)}?${params}`);
  }
}
