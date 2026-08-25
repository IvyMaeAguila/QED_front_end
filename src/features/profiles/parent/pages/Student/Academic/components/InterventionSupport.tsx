import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import type { InterventionFlag } from "../types/types";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";

interface InterventionSupportProps {
  flags: InterventionFlag[];
  theme: AdminThemeContext;
  student: DetailStudent;
}

export default function InterventionSupport({
  flags,
  theme,
  student,
}: InterventionSupportProps) {
  const { darkMode, panelBg, panelBorder, textPrimary } = theme;

  const okBg = darkMode ? "bg-green-900/20" : "bg-green-50";
  const okIcon = darkMode ? "text-green-400" : "text-green-600";
  const okText = darkMode ? "text-green-400" : "text-green-700";

  const warnBg = darkMode ? "bg-red-900/20" : "bg-red-50";
  const warnIcon = darkMode ? "text-red-400" : "text-red-600";
  const warnText = darkMode ? "text-red-400" : "text-red-700";

  return (
    <div className={`rounded-2xl border ${panelBorder} ${panelBg}`}>
      <SectionHeader
        icon={AlertTriangle}
        title="Intervention Support"
        about={`Provides targeted academic and behavioral support to assist  ${student.firstName}'s needing extra guidance based on their performance records`}
        theme={theme}
      />

      <div className="p-5 flex flex-col gap-2">
        {flags.length === 0 ? (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${okBg}`}
          >
            <CheckCircle2 size={16} className={`shrink-0 ${okIcon}`} />
            <p className={`text-xs font-medium ${okText}`}>
              No flagged intervention concern. Student is meeting standard
              behavioral and participation metrics.
            </p>
          </div>
        ) : (
          flags.map((f) => (
            <div
              key={f.id}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${warnBg}`}
            >
              <AlertTriangle size={16} className={`shrink-0 ${warnIcon}`} />
              <p className={`text-xs font-medium ${warnText}`}>{f.concern}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
