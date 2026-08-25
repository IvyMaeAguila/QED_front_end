import { useState } from "react";
import { CalendarPlus, PartyPopper, Landmark } from "lucide-react";
import { ACCENT, type CalendarTheme } from "../types/Calendar";

interface ManageCalendarButtonProps extends CalendarTheme {
  onSelectActivities: () => void;
  onSelectHolidays: () => void;
}

export function ManageCalendarButton({
  onSelectActivities,
  onSelectHolidays,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
}: ManageCalendarButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
        style={{ background: ACCENT }}
      >
        <CalendarPlus size={16} />
        Manage School Calendar
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className={`absolute left-0 right-0 z-40 mt-2 rounded-xl border shadow-lg overflow-hidden ${panelBg} ${panelBorder}`}>
            <button
              onClick={() => {
                setOpen(false);
                onSelectActivities();
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 text-sm font-bold transition-colors ${textPrimary} ${
                darkMode ? "hover:bg-white/10" : "hover:bg-[#FDF2F2]"
              }`}
            >
              <PartyPopper size={16} style={{ color: ACCENT }} />
              Activities
            </button>
            <div className={`h-px ${darkMode ? "bg-[#374151]" : "bg-[#E5E7EB]"}`} />
            <button
              onClick={() => {
                setOpen(false);
                onSelectHolidays();
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 text-sm font-bold transition-colors ${textPrimary} ${
                darkMode ? "hover:bg-white/10" : "hover:bg-[#FDF2F2]"
              }`}
            >
              <Landmark size={16} style={{ color: ACCENT }} />
              Holidays
            </button>
          </div>
        </>
      )}
    </div>
  );
}