import { X } from "lucide-react";
import type { ReactNode } from "react";
import { ACCENT, type CalendarTheme } from "../types/Calendar";

interface ExpandedListModalProps extends CalendarTheme {
  title: string;
  icon: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export function ExpandedListModal({ title, icon, onClose, panelBg, panelBorder, children }: ExpandedListModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden max-h-[85vh] flex flex-col ${panelBg} ${panelBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: ACCENT }}>
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
            <X size={14} className="text-white" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}