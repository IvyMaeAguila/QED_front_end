import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import type { InterventionFlag } from "../types/types";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";
import LowGradeTopicsService from "../service/intervention.service.ts";

interface InterventionSupportProps {
  theme: AdminThemeContext;
  student: DetailStudent;
}

export default function InterventionSupport({
  theme,
  student,
}: InterventionSupportProps) {
  const [flags, setFlags] = useState<InterventionFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadFlags() {
      setLoading(true);
      setError(null);
      try {
        const data = await LowGradeTopicsService.getLowGradeTopics(student.id);
        if (isMounted) setFlags(data);
      } catch (err) {
        console.error("Failed to load intervention flags:", err);
        if (isMounted) setError("Unable to load intervention data right now.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFlags();
    return () => {
      isMounted = false;
    };
  }, [student.id]);

  const { darkMode, panelBg, panelBorder } = theme;

  const okBg = darkMode ? "bg-green-900/20" : "bg-green-50";
  const okIcon = darkMode ? "text-green-400" : "text-green-600";
  const okText = darkMode ? "text-green-400" : "text-green-700";

  const warnBg = darkMode ? "bg-red-900/20" : "bg-red-50";
  const warnIcon = darkMode ? "text-red-400" : "text-red-600";
  const warnText = darkMode ? "text-red-400" : "text-red-700";
  const warnHoverBg = darkMode ? "hover:bg-red-900/30" : "hover:bg-red-100";

  const errBg = darkMode ? "bg-yellow-900/20" : "bg-yellow-50";
  const errIcon = darkMode ? "text-yellow-400" : "text-yellow-600";
  const errText = darkMode ? "text-yellow-400" : "text-yellow-700";

  const loadingBg = darkMode ? "bg-gray-800/40" : "bg-gray-50";
  const loadingIcon = darkMode ? "text-gray-400" : "text-gray-500";
  const loadingText = darkMode ? "text-gray-400" : "text-gray-600";

  function handleFlagClick(flag: InterventionFlag) {
    navigate(`/parent/students/${student.id}/topics/${flag.topicId}/support`);
  }

  return (
    <div className={`rounded-2xl border ${panelBorder} ${panelBg}`}>
      <SectionHeader
        icon={AlertTriangle}
        title="Intervention Support"
        about={`Provides targeted academic and behavioral support to assist  ${student.firstName}'s needing extra guidance based on their performance records`}
        theme={theme}
      />

      <div className="p-5 flex flex-col gap-2">
        {loading ? (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${loadingBg}`}>
            <Loader2 size={16} className={`shrink-0 animate-spin ${loadingIcon}`} />
            <p className={`text-xs font-medium ${loadingText}`}>
              Checking for intervention concerns...
            </p>
          </div>
        ) : error ? (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${errBg}`}>
            <AlertTriangle size={16} className={`shrink-0 ${errIcon}`} />
            <p className={`text-xs font-medium ${errText}`}>{error}</p>
          </div>
        ) : flags.length === 0 ? (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${okBg}`}>
            <CheckCircle2 size={16} className={`shrink-0 ${okIcon}`} />
            <p className={`text-xs font-medium ${okText}`}>
              No flagged intervention concern. Student is meeting standard
              behavioral and participation metrics.
            </p>
          </div>
        ) : (
          flags.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleFlagClick(f)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors ${warnBg} ${warnHoverBg} cursor-pointer`}
            >
              <AlertTriangle size={16} className={`shrink-0 ${warnIcon}`} />
              <p className={`flex-1 text-xs font-medium ${warnText}`}>{f.concern}</p>
              <ChevronRight size={16} className={`shrink-0 ${warnIcon}`} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}