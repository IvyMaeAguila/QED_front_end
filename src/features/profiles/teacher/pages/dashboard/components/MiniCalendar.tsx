import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function MiniCalendar({ panelBg, panelBorder, textPrimary, textMuted }: Props) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const part = (type: string) => Number(parts.find(value => value.type === type)?.value);
  const today = { year: part("year"), month: part("month") - 1, day: part("day") };
  const [view, setView] = useState(() => new Date(today.year, today.month, 1));
  const year = view.getFullYear();
  const month = view.getMonth();
  const cells: (number | null)[] = [
    ...Array.from({ length: new Date(year, month, 1).getDay() }, () => null),
    ...Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => index + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const currentMonth = year === today.year && month === today.month;
  return <section className={`rounded-[12px] border p-4 shadow-card ${panelBg} ${panelBorder}`} aria-label="Mini calendar">
    <div className={`mb-4 flex items-center justify-between ${textPrimary}`}>
      <button aria-label="Previous month" className="rounded-lg p-2 hover:bg-gray-500/10" onClick={() => setView(new Date(year, month - 1, 1))}><ChevronLeft size={16} /></button>
      <h2 className="qed-type-label font-semibold" aria-live="polite">{view.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
      <button aria-label="Next month" className="rounded-lg p-2 hover:bg-gray-500/10" onClick={() => setView(new Date(year, month + 1, 1))}><ChevronRight size={16} /></button>
    </div>
    <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <span key={day} className={`pb-1 font-semibold ${textMuted}`}>{day}</span>)}
      {cells.map((day, index) => <span key={index} aria-current={currentMonth && day === today.day ? "date" : undefined} className={`flex h-8 items-center justify-center rounded-full ${currentMonth && day === today.day ? "bg-maroon font-bold text-white" : textPrimary}`}>{day}</span>)}
    </div>
    <div className={`mt-4 flex items-center justify-between border-t pt-3 text-xs ${panelBorder} ${textMuted}`}>
      <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-maroon" />Today</span>
      {!currentMonth && <button className="font-semibold underline" onClick={() => setView(new Date(today.year, today.month, 1))}>Current month</button>}
    </div>
  </section>;
}
