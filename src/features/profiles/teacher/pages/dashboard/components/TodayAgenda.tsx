import { CalendarClock, Clock } from "lucide-react";

export interface AgendaItem {
  id: string;
  time: string;
  subject: string;
}

interface TodayAgendaProps {
  agenda: AgendaItem[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function TodayAgenda({
  agenda,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: TodayAgendaProps) {
  return (
    <div
      className={`h-full flex flex-col rounded-2xl border overflow-hidden ${panelBg} ${panelBorder}`}
      style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)" }}
    >
      <div className={`px-7 py-6 border-b flex items-center justify-between ${panelBorder}`}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: darkMode ? "rgba(139,13,13,0.15)" : "#FDEEEE" }}
          >
            <CalendarClock size={16} style={{ color: "#8B0D0D" }} />
          </div>
          <div>
            <h2 className={`text-[14px] font-bold leading-tight ${textPrimary}`}>
              Today&apos;s Agenda
            </h2>
            <p className={`text-[11px] font-medium ${textMuted}`}>Your class schedule</p>
          </div>
        </div>
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
          style={{
            background: darkMode ? "rgba(139,13,13,0.15)" : "#FDEEEE",
            color: "#8B0D0D",
          }}
        >
          {agenda.length} {agenda.length === 1 ? "class" : "classes"}
        </span>
      </div>

      <div className="flex-1 p-7">
        {agenda.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-6 gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9" }}
            >
              <CalendarClock size={16} className={textMuted} />
            </div>
            <p className={`text-xs font-semibold ${textMuted}`}>No classes scheduled today.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {agenda.map((item, i) => (
              <div key={item.id} className="relative pl-7 py-3 group cursor-default">
                <span
                  className="absolute left-0.75 top-4.5 w-2 h-2 rounded-full ring-4 transition-all"
                  style={{
                    background: "#8B0D0D",
                    boxShadow: darkMode
                      ? "0 0 0 4px rgba(139,13,13,0.15)"
                      : "0 0 0 4px rgba(139,13,13,0.08)",
                  }}
                />
                {i !== agenda.length - 1 && (
                  <span
                    className="absolute left-1.75 top-6.5 -bottom-1 w-px"
                    style={{ background: darkMode ? "rgba(255,255,255,0.08)" : "#E5E7EB" }}
                  />
                )}

                <div className="flex items-center justify-between gap-3">
                  <p
                    className={`text-[13.5px] font-bold leading-tight group-hover:translate-x-0.5 transition-transform ${textPrimary}`}
                  >
                    {item.subject}
                  </p>
                  <span
                    className="flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-md whitespace-nowrap shrink-0"
                    style={{
                      color: textMuted.includes("text-") ? undefined : textMuted,
                      background: darkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                    }}
                  >
                    <Clock size={10} className={textMuted} />
                    <span className={textMuted}>{item.time}</span>
                  </span>
                </div>

                {i !== agenda.length - 1 && (
                  <div
                    className="mt-3 border-b"
                    style={{ borderColor: darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9" }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}