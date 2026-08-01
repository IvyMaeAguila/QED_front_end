import { CalendarClock } from "lucide-react";

export interface AgendaItem {
  id: string;
  time: string;
  subject: string;
}

interface TodayAgendaProps {
  agenda: AgendaItem[];
}

export function TodayAgenda({ agenda }: TodayAgendaProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden text-white"
      style={{
        background: "linear-gradient(160deg, #5C0000 0%, #7A0000 55%, #6B0000 100%)",
        boxShadow: "0 12px 28px rgba(85,0,0,0.2)",
      }}
    >
      <div className="px-7 pt-6 pb-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <CalendarClock size={16} className="text-white/90" />
          <h2 className="text-[13px] font-bold uppercase tracking-wider">Today&apos;s Agenda</h2>
        </div>
        <span className="text-[10px] font-bold bg-white/10 px-2.5 py-1 rounded-md uppercase tracking-widest">
          {agenda.length} {agenda.length === 1 ? "class" : "classes"}
        </span>
      </div>

      <div className="p-7 flex flex-col gap-6">
        {agenda.map((item, i) => (
          <div key={item.id} className="relative pl-6 group cursor-default">
            <span className="absolute left-0 top-[3px] w-2.5 h-2.5 rounded-full border-2 border-white/60 bg-white/10 group-hover:bg-white transition-colors" />
            {i !== agenda.length - 1 && (
              <span className="absolute left-[4.5px] top-4 bottom-[-24px] w-px bg-white/15" />
            )}
            <p className="text-[13px] font-bold group-hover:translate-x-0.5 transition-transform">
              {item.subject}
            </p>
            <p className="text-[11px] font-semibold text-white/55 mt-0.5">{item.time}</p>
          </div>
        ))}
        {agenda.length === 0 && (
          <p className="text-xs font-semibold text-white/50 py-2">No classes scheduled.</p>
        )}
      </div>
    </div>
  );
}