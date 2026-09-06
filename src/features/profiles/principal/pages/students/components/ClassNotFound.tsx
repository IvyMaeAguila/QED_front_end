import { useNavigate } from "react-router-dom";
import { BackButton } from "../../../../shared/components/DashboardUI";

interface ClassNotFoundProps {
  gradeLabel: string;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function ClassNotFound({ gradeLabel, panelBg, panelBorder, textPrimary, textMuted }: ClassNotFoundProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center gap-3">
        <BackButton onClick={() => navigate("/principal/students")} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
        <h1 className={`text-xl font-black tracking-tight ${textPrimary}`}>Section Not Found</h1>
      </div>
      <div className={`rounded-2xl border ${panelBg} ${panelBorder} p-8 text-center shadow-card`}>
        <p className={`text-sm ${textMuted}`}>No section record found for "{gradeLabel}".</p>
      </div>
    </div>
  );
}
