import { useMemo,useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { usePrincipalGradebooks } from "./hooks/usePrincipalGradebooks";

import { SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { rememberRows,skeletonRows } from "@shared/loading/reservations";
import { GradeLevelFilterDropdown } from "../students/components/GradeLevelFilterDropdown";
import { GradeLevelSearchInput } from "../students/components/GradeLevelSearchInput";
import { GradebooksHeader } from "./components/GradebooksHeader";
import { GradeLevelCards } from "./components/GradeLevelCards";

type GroupMode = "grade" | "all";


function usePrincipalGradebooksPageState() {
  const theme = useOutletContext<AdminThemeContext>();
  const { panelBg, panelBorder, textPrimary, textMuted } = theme;
  const navigate = useNavigate();

  const { gradeLevels, schoolYear, loading, error, retry } =
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
    `qed-segmented-control__item rounded-lg px-3 text-xs font-semibold transition-colors ${active ? "bg-maroon text-white" : `${textMuted} ${theme.darkMode ? "hover:text-white" : "hover:text-gray-700"}`}`;


  const view = `principal-gradebooks:${search}:${gradeFilter}:${sectionFilter}:${groupMode}`;
  const renderGradebooks = (pending: boolean) => {
    const rows = pending ? Array.from({ length: skeletonRows(view, undefined, 218) }, (_, index) => ({ gradeLevelId: index, grade: " ", section: "", totalStudents: 0, adviserName: null, isSubmitted: false, gradingPeriodId: null })) : filtered;
    const visibleGroups: [string, typeof rows][] = pending ? [["", rows]] : groups;
    return (          <div className={`rounded-2xl border shadow-card ${panelBg} ${panelBorder}`} data-sk-region="principalgradebookspage-div-field-1">
            {rows.length === 0 ? (
              <p className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`} data-sk-region="principalgradebookspage-no-gradebooks-match-your-search-or-filters-" data-sk-static="">
                No gradebooks match your search or filters.
              </p>
            ) : groupMode === "all" ? (
              <div className="p-4">
                <GradeLevelCards loading={pending} yearLoading={loading && !schoolYear}
                  gradeLevels={rows}
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
              <div className="space-y-7 p-4" data-sk-region="principalgradebookspage-div-field-2">
                {visibleGroups.map(([label, items]) => (
                  <section key={label}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-5 w-1 rounded-full bg-maroon" />
                      <h2 className={`text-xs font-extrabold uppercase tracking-wide ${textPrimary}`} data-sk-region="principalgradebookspage-h2-field-3">
                        {pending ? <SkeletonText width="12ch" /> : label}
                      </h2>
                      <span className={`h-px flex-1 ${theme.darkMode ? "bg-white/10" : "bg-gray-200"}`} />
                    </div>
                <GradeLevelCards loading={pending} yearLoading={loading && !schoolYear}
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

    );
  };
  return { content: ((
    <div className="flex flex-col gap-6 font-sans">
      <GradebooksHeader loading={loading}
        schoolYear={schoolYear}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />

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
              <button type="button" onClick={() => setGroupMode("grade")} aria-pressed={groupMode === "grade"} className={toggleClass(groupMode === "grade")} data-sk-region="principalgradebookspage-by-grade-level" data-sk-static="">By Grade Level</button>
              <button type="button" onClick={() => setGroupMode("all")} aria-pressed={groupMode === "all"} className={toggleClass(groupMode === "all")} data-sk-region="principalgradebookspage-all" data-sk-static="">All</button>
            </div>
          </GradeLevelSearchInput>

          <LoadingRegion name="principal-gradebook-collection" loading={loading} error={error} retry={retry} variable frame={renderGradebooks} skeleton={null} retainPrevious initialContentKnown={gradeLevels.length > 0} hasContent={filtered.length > 0} onSettled={() => rememberRows(view, filtered.length)}>{null}</LoadingRegion>
        </>
    </div>
  )), scope: {  } };

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


export type PrincipalGradebooksPageEffectScope = ReturnType<typeof usePrincipalGradebooksPageState>["scope"];
export type PrincipalGradebooksPageRouteProps = Record<string, never>;
export function PrincipalGradebooksPageComposition(props: object & { effects?: (scope: PrincipalGradebooksPageEffectScope) => import("react").ReactNode }) {
 const state = usePrincipalGradebooksPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
