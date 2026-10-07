import { useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { AdminThemeContext } from "./../AdminLayout";
import { SubjectGradeTemplateSection } from "./components/SubjectGradeTemplateSection";
import {
  getActiveGradeTemplate,
  type ActiveGradeTemplate,
} from "./services/subjectGradeTemplate.service";

export function AdminSubjectDetailPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId: string }>();

  const [activeTemplate, setActiveTemplate] = useState<ActiveGradeTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  const numericSubjectId = subjectId ? Number(subjectId) : null;

  useEffect(() => {
    if (!numericSubjectId) return;
    setLoadingTemplate(true);
    getActiveGradeTemplate(numericSubjectId)
      .then(setActiveTemplate)
      .catch((err) => {
        console.error("Failed to load active grade template:", err);
        setActiveTemplate(null);
      })
      .finally(() => setLoadingTemplate(false));
  }, [numericSubjectId]);

  if (!numericSubjectId) {
    return (
      <div className="w-full">
        <p className={textMuted}>Invalid subject.</p>
      </div>
    );
  }

  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `qed-type-page-title ${textPrimary}`;

  return (
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
                  : "border-[#E5E7EB] hover:bg-[#F6F7FB] text-[#374151]"
              }`}
            >
              <ArrowLeft />
            </button>
            <div className="min-w-0">
              <h1 className={sectionTitleClasses}>Subject Details</h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
                Review the active grade template for this subject.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-xl">
          {loadingTemplate ? (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Loading template…
            </div>
          ) : (
            <SubjectGradeTemplateSection
              subjectId={numericSubjectId}
              darkMode={darkMode}
              activeTemplate={activeTemplate}
              onTemplateUpdated={setActiveTemplate}
            />
          )}
        </div>
      </section>
    </div>
  );
}
