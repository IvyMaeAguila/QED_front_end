import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonControl } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { skeletonRows, rememberRows } from "@shared/loading/reservations";
import { useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
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

  const [attempt,setAttempt] = useState(0);
  const view = `parent-intervention:${student.id}`;
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
  }, [student.id, attempt]);

  const { darkMode, panelBg, panelBorder } = theme;

  const okBg = darkMode ? "bg-green-900/20" : "bg-green-50";
  const okIcon = darkMode ? "text-green-400" : "text-green-600";
  const okText = darkMode ? "text-green-400" : "text-green-700";

  const warnBg = darkMode ? "bg-red-900/20" : "bg-red-50";
  const warnIcon = darkMode ? "text-red-400" : "text-red-600";
  const warnText = darkMode ? "text-red-400" : "text-red-700";
  const warnHoverBg = darkMode ? "hover:bg-red-900/30" : "hover:bg-red-100";

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
        <LoadingRegion name="parent-intervention" loading={loading} error={error} retry={() => setAttempt(n=>n+1)} variable retainPrevious hasContent={flags.length > 0} skeleton={null} onSettled={() => rememberRows(view,flags.length)} frame={(pending) => (
        !pending && flags.length === 0 ? (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${okBg}`}>
            <CheckCircle2 size={16} className={`shrink-0 ${okIcon}`} />
            <p className={`text-xs font-medium ${okText}`}>
              No flagged intervention concern. Student is meeting standard
              behavioral and participation metrics.
            </p>
          </div>
        ) : (
          (pending ? Array.from({length:skeletonRows(view)},(_,i)=>({id:String(i),topicId:0,concern:"",severity:"low" as const})) : flags).map((f) => (
            <button
              key={f.id}
              disabled={pending}
              type="button"
              onClick={() => handleFlagClick(f)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors ${pending ? (darkMode ? "bg-white/5" : "bg-gray-50") : `${warnBg} ${warnHoverBg}`} cursor-pointer`}
            >
              {pending ? <SkeletonControl className="h-4 w-4 shrink-0" /> : <AlertTriangle size={16} className={`shrink-0 ${warnIcon}`} />}
              <p className={`flex-1 text-xs font-medium ${warnText}`}>{pending ? <SkeletonParagraph field={view+":"+f.id} typical={3} width="100%" /> : <span data-sk-field={view+":"+f.id}>{f.concern}</span>}</p>
              <ChevronRight size={16} className={`shrink-0 ${warnIcon}`} />
            </button>
          ))
        ))}>{null}</LoadingRegion>
      </div>
    </div>
  );
}