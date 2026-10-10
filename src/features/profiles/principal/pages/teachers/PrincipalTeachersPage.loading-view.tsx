import { useNavigate } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { TeacherDirectoryTable } from "./components/TeacherDirectoryTable";
import { useTeachersDirectory } from "./hooks/useTeachersDirectory";

function usePrincipalTeachersPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { teachers, schoolYear, loading, error, retry } = useTeachersDirectory();

  return { content: ((
    <div className="flex flex-col gap-8 font-sans">
      <div>
        <h1 className={`qed-type-page-title ${textPrimary}`}>Teachers</h1>
        <p className={`qed-type-page-description mt-2 ${textMuted}`}>
          Teacher list and advisory assignments &middot; School Year {schoolYear}
        </p>
      </div>

        <TeacherDirectoryTable
          loading={loading} error={error} retry={retry}
          teachers={teachers}
          onSelectTeacher={(teacherId) => navigate(`/principal/teachers/${encodeURIComponent(teacherId)}`)}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          darkMode={darkMode}
        />
    </div>
  )), scope: {  } };
}


export type PrincipalTeachersPageEffectScope = ReturnType<typeof usePrincipalTeachersPageState>["scope"];
export type PrincipalTeachersPageRouteProps = Record<string, never>;
export function PrincipalTeachersPageComposition(props: object & { effects?: (scope: PrincipalTeachersPageEffectScope) => import("react").ReactNode }) {
 const state = usePrincipalTeachersPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
