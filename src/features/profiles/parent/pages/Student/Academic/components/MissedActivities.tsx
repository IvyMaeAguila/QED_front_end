import { useMemo } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";
import type { MissedActivity } from "../types/types";
import { MissedActivitiesProvider, useMissedActivities } from "../context/missedActivities.context";

interface MissedActivitiesProps {
  theme: AdminThemeContext;
  student: DetailStudent;
}

const MAROON = "#8f0000";

export default function MissedActivities({ theme, student }: MissedActivitiesProps) {
  return (
    <MissedActivitiesProvider studentId={student.id}>
      <MissedActivitiesContent theme={theme} student={student} />
    </MissedActivitiesProvider>
  );
}

function MissedActivitiesContent({ theme, student }: MissedActivitiesProps) {
  const { activities, loading, error } = useMissedActivities();
  const { darkMode, panelBg, panelBorder, textPrimary } = theme;

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

  const typeBadgeBase = "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";
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

      {loading ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <Loader2 size={18} className={`animate-spin ${emptyIcon}`} />
          <p className={`text-xs ${emptyText}`}>Loading missed activities...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${emptyIconBg}`}>
            <AlertCircle size={18} className="text-rose-400" />
          </div>
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      ) : activities.length === 0 ? (
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
          {groupedByDate.map(([dueDate, items]) => (
            <div key={dueDate} className="flex gap-3">
              <div className="flex w-16 shrink-0 flex-col items-center pt-3">
                <span className="text-sm font-extrabold leading-none" style={{ color: MAROON }}>
                  {dueDate.split(",")[0]?.split(" ")[1] ?? ""}
                </span>
                <span className="text-[11px] font-bold uppercase leading-none" style={{ color: MAROON }}>
                  {dueDate.split(",")[0]?.split(" ")[0] ?? ""}
                </span>
                <span className={`mt-1 text-[10px] ${dateSubText}`}>
                  {dueDate.split(",")[1]?.trim() ?? ""}
                </span>
              </div>

              <div className={`flex-1 overflow-hidden rounded-xl border ${cardBorder} ${cardBg}`}>
                <div className={`divide-y ${rowBorder}`}>
                  {items.map((a) => (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${rowHover}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold ${topicText}`}>{a.topic}</p>
                        <p className={`mt-0.5 text-xs ${subjectText}`}>{a.subject} | {a.maxItems} points</p>
                      </div>
                      <span className={`${typeBadgeBase} ${typeBadgeStyles[a.type]}`}>{a.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}