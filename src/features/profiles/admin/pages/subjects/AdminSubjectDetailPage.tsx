import { useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import type { AdminThemeContext } from "./../AdminLayout";
import { ACCENT } from "./types/types";
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
      <div className="w-full mt-6 px-4 sm:px-6">
        <p className={textMuted}>Invalid subject.</p>
      </div>
    );
  }

  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 ${textPrimary}`;

  return (
    <div className="w-full mt-6 space-y-6 pb-12 px-4 sm:px-6">
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/subjects")}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
                darkMode
                  ? "border-[#374151] hover:bg-white/10 text-white"
                  : "border-[#E5E7EB] hover:bg-[#F6F7FB] text-[#374151]"
              }`}
            >
              <ArrowLeft size={14} />
            </button>
            <h2 className={sectionTitleClasses}>
              <BookOpen size={15} style={{ color: ACCENT }} />
              Subject Details
            </h2>
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