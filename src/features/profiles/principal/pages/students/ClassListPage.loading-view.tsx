import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { BackButton } from "../../../shared/components/DashboardUI";
import { ClassNotFound } from "./components/ClassNotFound";
import { ClassRoster } from "./components/ClassRoster";
import { useClassList,type ClassListTarget } from "./hooks/useClassList";

function useClassListPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { classId, gradeId } = useParams<{ classId?: string; gradeId?: string }>();

  let target: ClassListTarget | undefined;
  let isInvalidId = false;

  if (classId !== undefined) {
    const parsed = Number(classId);
    if (Number.isNaN(parsed)) isInvalidId = true;
    else target = { type: "class", id: parsed };
  } else if (gradeId !== undefined) {
    const parsed = Number(gradeId);
    if (Number.isNaN(parsed)) isInvalidId = true;
    else target = { type: "grade", id: parsed };
  }

  const { classList, schoolYear, loading, notFound, error, retry } = useClassList(target);

  if ((!loading && !error && (notFound || !classList)) || isInvalidId) {
    return { content: ((
      <ClassNotFound
        gradeLabel={classId ?? gradeId ?? ""}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />
    )), scope: {  } };
  }

  const record = classList ?? { grade: "", sectionInfo: { section: "", adviser: "", room: "" }, roster: [] };
  const view = `principal-roster:${target?.type}:${target?.id}`;
  return { content: ((
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-start gap-2.5">
        <BackButton onClick={() => navigate("/principal/students")} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-maroon">
            <LoadingRegion as="span" loading={loading} variable skeleton={<SkeletonParagraph field={`${view}:title`} width="24ch" />}><span data-sk-field={`${view}:title`} className="block">{record.grade} · {record.sectionInfo.section}</span></LoadingRegion>
          </p>
          <h1 className={`qed-type-page-title mt-1 ${textPrimary}`} data-sk-region="classlistpage-class-list" data-sk-static="">
            Class List
          </h1>
          <p className={`qed-type-page-description mt-1 ${textMuted}`}>
            <LoadingRegion as="span" loading={loading} variable skeleton={<SkeletonParagraph field={`${view}:description`} typical={3} width="60ch" />}><span data-sk-field={`${view}:description`} className="block">School Year {schoolYear} · Adviser {record.sectionInfo.adviser} · Room {record.sectionInfo.room}</span></LoadingRegion>
          </p>
        </div>
      </div>

      <ClassRoster
        roster={record.roster}
        loading={loading} error={error} retry={retry} view={view}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
    </div>
  )), scope: {  } };
}



export type ClassListPageEffectScope = ReturnType<typeof useClassListPageState>["scope"];
export type ClassListPageRouteProps = Record<string, never>;
export function ClassListPageComposition(props: object & { effects?: (scope: ClassListPageEffectScope) => import("react").ReactNode }) {
 const state = useClassListPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
