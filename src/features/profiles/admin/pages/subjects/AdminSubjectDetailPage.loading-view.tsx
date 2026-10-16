import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "./../AdminLayout";
import { SubjectGradeTemplateSection } from "./components/SubjectGradeTemplateSection";
import {
getActiveGradeTemplate,
type ActiveGradeTemplate,
} from "./services/subjectGradeTemplate.service";

function useAdminSubjectDetailPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId: string }>();

  const [activeTemplate, setActiveTemplate] = useState<ActiveGradeTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const numericSubjectId = subjectId ? Number(subjectId) : null;

  if (!numericSubjectId) {
    return { content: ((
      <div className="w-full">
        <p className={textMuted} data-sk-region="adminsubjectdetailpage-invalid-subject-" data-sk-static="">Invalid subject.</p>
      </div>
    )), scope: { numericSubjectId, setLoadingTemplate, setTemplateError, getActiveGradeTemplate, setActiveTemplate, attempt } };
  }

  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `qed-type-page-title ${textPrimary}`;
  const renderTemplate = (pending: boolean) => <SubjectGradeTemplateSection
    subjectId={numericSubjectId}
    darkMode={darkMode}
    loading={pending}
    activeTemplate={activeTemplate}
    onTemplateUpdated={setActiveTemplate}
  />;

  return { content: ((
    <div className="w-full space-y-6 pb-12">
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/subjects")}
              aria-label="Go back to academics"
              className={`system-back-button shrink-0 ${
                darkMode
                  ? "border-[#374151] hover:bg-white/10 text-white"
                  : "border-border-subtle hover:bg-brand-light text-[#374151]"
              }`}
            >
              <ArrowLeft />
            </button>
            <div className="min-w-0">
              <h1 className={sectionTitleClasses} data-sk-region="adminsubjectdetailpage-subject-details" data-sk-static="">Subject Details</h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`} data-sk-region="adminsubjectdetailpage-review-the-active-grade-template-for-this-sub" data-sk-static="">
                Review the active grade template for this subject.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-xl">
          {templateError && renderTemplate(false)}
          <LoadingRegion loading={loadingTemplate} error={templateError} retry={() => setAttempt(value => value + 1)} name="subject-template" variable skeleton={null} frame={renderTemplate} retainPrevious hasContent={!!activeTemplate}>{null}</LoadingRegion>
        </div>
      </section>
    </div>
  )), scope: { numericSubjectId, setLoadingTemplate, setTemplateError, getActiveGradeTemplate, setActiveTemplate, attempt } };
}


export type AdminSubjectDetailPageEffectScope = ReturnType<typeof useAdminSubjectDetailPageState>["scope"];
export type AdminSubjectDetailPageRouteProps = Record<string, never>;
export function AdminSubjectDetailPageComposition(props: object & { effects?: (scope: AdminSubjectDetailPageEffectScope) => import("react").ReactNode }) {
 const state = useAdminSubjectDetailPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
