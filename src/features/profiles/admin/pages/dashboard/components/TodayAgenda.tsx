import { ClipboardList, Clock } from "lucide-react";

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
  textPrimary,
  textMuted,
}: TodayAgendaProps) {
  return (
    <div className={`rounded-xl2 p-4 sm:p-5 shadow-card ${panelBg}`}>
      <p
        className={`mb-2.5 sm:mb-3 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wide ${textMuted}`}
      >
        <ClipboardList size={13} className="text-maroon-dark shrink-0 sm:hidden" />
        <ClipboardList size={14} className="text-maroon-dark shrink-0 hidden sm:block" />
        Today&apos;s Agenda
      </p>

      {agenda.length === 0 ? (
        <p className={`py-2 text-[11px] sm:text-xs ${textMuted}`}>
          No classes scheduled today.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5 sm:gap-3">
          {agenda.map((item) => (
            <li
              key={item.id}
              className="border-l-2 border-maroon pl-2.5 sm:pl-3 text-[11.5px] sm:text-xs leading-relaxed"
            >
              {item.time && (
                <span className={`flex items-center gap-1 font-semibold ${textMuted}`}>
                  <Clock size={10} className="shrink-0" />
                  {item.time}
                </span>
              )}
              <span className={`font-semibold ${textPrimary}`}>{item.subject}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}