import { useNavigate } from "react-router-dom";
import { BackButton } from "../../../../shared/components/DashboardUI";

interface TeacherNotFoundProps {
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function TeacherNotFound({ panelBg, panelBorder, textPrimary, textMuted }: TeacherNotFoundProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center gap-3">
        <BackButton onClick={() => navigate("/principal/teachers")} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
        <h1 className={`text-xl font-black tracking-tight ${textPrimary}`}>Teacher Not Found</h1>
      </div>
      <div className={`rounded-2xl border ${panelBg} ${panelBorder} p-8 text-center shadow-card`}>
        <p className={`text-sm ${textMuted}`}>No schedule record found for this teacher.</p>
      </div>
    </div>
  );
}
