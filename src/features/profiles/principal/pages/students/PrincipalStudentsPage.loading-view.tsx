import { SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { rememberRows,skeletonRows } from "@shared/loading/reservations";
import { useMemo,useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { GradeLevelFilterDropdown } from "./components/GradeLevelFilterDropdown";
import { GradeLevelGrid } from "./components/GradeLevelGrid";
import { GradeLevelSearchInput } from "./components/GradeLevelSearchInput";
import { usePrincipalStudentsOverview } from "./hooks/usePrincipalStudentsOverview";

function usePrincipalStudentsPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { gradeLevels, totalStudents, schoolYear, loading, error, retry } =
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
  const view = `principal-grades:${search}:${gradeFilter}:${sectionFilter}`;
  const renderGrades = (pending: boolean) => {
    const rows = pending ? Array.from({ length: skeletonRows(view) }, (_, index) => ({ gradeId: index, classId: index, grade: "", section: "", totalStudents: 0 })) : filtered;
    return !pending && rows.length === 0 ? <p className={`py-10 text-center text-xs font-medium ${textMuted}`} data-sk-region="principalstudentspage-no-grade-levels-match-your-search-or-filters-" data-sk-static="">No grade levels match your search or filters.</p> : <GradeLevelGrid gradeLevels={rows} loading={pending} onViewClassList={handleViewClassList} {...gridProps} />;
  };

  return { content: ((
    <div className="flex flex-col gap-6 font-sans">
      {/* Header */}
      <div>
        <h1 className={`qed-type-page-title ${textPrimary}`} data-sk-region="principalstudentspage-students" data-sk-static="">
          Students
        </h1>
        <p className={`qed-type-page-description mt-2 ${textMuted}`} data-sk-region="principalstudentspage-enrollment-overview-by-grade-level-middot-sch" data-sk-static="">
          Enrollment overview by grade level &middot; School Year <LoadingRegion as="span" loading={loading} variable skeleton={<SkeletonText width="10ch" />}>{schoolYear}</LoadingRegion>
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
          <span className={`text-xs font-extrabold ${textPrimary}`}>
            <LoadingRegion as="span" loading={loading} skeleton={<SkeletonText width="3ch" />}>{totalStudents.toLocaleString()}</LoadingRegion>
          </span>
          <span className={`text-xs font-medium ${textMuted}`} data-sk-region="principalstudentspage-total-students" data-sk-static="">
            Total Students
          </span>
        </div>

      </GradeLevelSearchInput>

      <LoadingRegion name="principal-grade-collection" loading={loading} error={error} retry={retry} variable frame={renderGrades} retainPrevious hasContent={filtered.length > 0} skeleton={renderGrades(true)} onSettled={() => rememberRows(view, filtered.length)}>
        {renderGrades(false)}
      </LoadingRegion>
    </div>
  )), scope: {  } };
}



export type PrincipalStudentsPageEffectScope = ReturnType<typeof usePrincipalStudentsPageState>["scope"];
export type PrincipalStudentsPageRouteProps = Record<string, never>;
export function PrincipalStudentsPageComposition(props: object & { effects?: (scope: PrincipalStudentsPageEffectScope) => import("react").ReactNode }) {
 const state = usePrincipalStudentsPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
