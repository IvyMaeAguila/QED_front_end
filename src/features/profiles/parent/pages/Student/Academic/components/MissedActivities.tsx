import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { skeletonRows, rememberRows } from "@shared/loading/reservations";
import { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";
import type { MissedActivity } from "../types/types";
import { MissedActivitiesProvider, useMissedActivities } from "../context/missedActivities.context";

interface MissedActivitiesProps {
  theme: AdminThemeContext;
  student: DetailStudent;
}


export default function MissedActivities({ theme, student }: MissedActivitiesProps) {
  return (
    <MissedActivitiesProvider studentId={student.id}>
      <MissedActivitiesContent theme={theme} student={student} />
    </MissedActivitiesProvider>
  );
}

function MissedActivitiesContent({ theme, student }: MissedActivitiesProps) {
  const { activities, loading, error, retry } = useMissedActivities();
  const { darkMode, panelBg, panelBorder } = theme;

  const view = `parent-missed:${student.id}`;
  const emptyIconBg = darkMode ? "bg-white/5" : "bg-gray-100";
  const emptyIcon = darkMode ? "text-gray-500" : "text-gray-400";
  const emptyText = darkMode ? "text-gray-500" : "text-gray-400";

  const dateSubText = darkMode ? "text-gray-500" : "text-gray-400";

  const cardBg = darkMode ? "bg-white/[0.03]" : "bg-gray-50/70";
  const cardBorder = darkMode ? "border-white/[0.06]" : "border-gray-100";
  const rowBorder = darkMode ? "divide-white/[0.06]" : "divide-gray-100";
  const rowHover = darkMode ? "hover:bg-white/[0.04]" : "hover:bg-white";

  const topicText = darkMode ? "text-gray-100" : "text-gray-900";
  const subjectText = darkMode ? "text-gray-400" : "text-gray-500";

  const typeBadgeBase = "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide";
  const typeBadgeStyles: Record<MissedActivity["type"], string> = darkMode
    ? {
        "Written Works": "bg-sky-500/10 text-sky-300",
        "Performance Task": "bg-amber-500/10 text-amber-300",
        Examination: "bg-rose-500/10 text-rose-300",
      }
    : {
        "Written Works": "bg-sky-50 text-sky-700",
        "Performance Task": "bg-amber-50 text-amber-700",
        Examination: "bg-rose-50 text-rose-700",
      };

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, MissedActivity[]>();
    for (const activity of activities) {
      const existing = groups.get(activity.dueDate);
      if (existing) {
        existing.push(activity);
      } else {
        groups.set(activity.dueDate, [activity]);
      }
    }
    return Array.from(groups.entries());
  }, [activities]);

  return (
    <div className={`rounded-2xl border ${panelBorder} ${panelBg}`}>
      <SectionHeader
        icon={CheckCircle2}
        title="Missed Activities"
        about={`Tracks and reports on assignments and activities that ${student.firstName} has missed across all subjects.`}
        theme={theme}
      />

      <LoadingRegion name="parent-missed-activities" loading={loading} error={error} retry={retry} variable retainPrevious hasContent={activities.length > 0} skeleton={null} onSettled={() => rememberRows(view,groupedByDate.length)} frame={(pending) => (
      !pending && activities.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${emptyIconBg}`}>
            <CheckCircle2 size={18} className={emptyIcon} />
          </div>
          <p className={`text-xs ${emptyText}`}>
            No missed activities or assignments recorded across subjects.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 pb-4 pt-4">
          {(pending ? Array.from({length:skeletonRows(view)},(_,i)=>[String(i),[{id:String(i),topic:"",subject:"",maxItems:0,type:"Written Works"}]] as [string,MissedActivity[]]) : groupedByDate).map(([dueDate, items]) => (
            <div key={dueDate} className="flex gap-3">
              <div className="flex w-16 shrink-0 flex-col items-center pt-3">
                <span className="text-sm font-extrabold leading-none" style={{ color: "var(--brand-ink)" }}>
                  {pending ? <SkeletonText width="2ch" /> : dueDate.split(",")[0]?.split(" ")[1] ?? ""}
                </span>
                <span className="text-xs font-bold uppercase leading-none" style={{ color: "var(--brand-ink)" }}>
                  {pending ? <SkeletonText width="3ch" /> : dueDate.split(",")[0]?.split(" ")[0] ?? ""}
                </span>
                <span className={`mt-1 text-xs ${dateSubText}`}>
                  {pending ? <SkeletonText width="4ch" /> : dueDate.split(",")[1]?.trim() ?? ""}
                </span>
              </div>

              <div className={`flex-1 overflow-hidden rounded-lg border ${cardBorder} ${cardBg}`}>
                <div className={`divide-y ${rowBorder}`}>
                  {items.map((a) => (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${rowHover}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold ${topicText}`}>{pending ? <SkeletonText width="14ch" /> : a.topic}</p>
                        <p className={`mt-0.5 text-xs ${subjectText}`}>{pending ? <SkeletonParagraph field={view+":subject:"+a.id} typical={2} width="18ch" /> : <span data-sk-field={view+":subject:"+a.id}>{a.subject} | {a.maxItems} points</span>}</p>
                      </div>
                      <span className={`${typeBadgeBase} ${pending ? "" : typeBadgeStyles[a.type]}`}>{pending ? <SkeletonText width="8ch" /> : a.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}>{null}</LoadingRegion>
    </div>
  );
}
