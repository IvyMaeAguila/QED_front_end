import { X } from "lucide-react";
import { HOLISTIC_LEVELS } from "../types/Grading";

const ACCENT = "#6B0000";

interface LegendsModalProps {
  onClose: () => void;
  darkMode: boolean;
  panelBorder: string;
  textPrimary: string;
}

export function LegendsModal({ onClose, darkMode, panelBorder, textPrimary }: LegendsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-xl ${darkMode ? "bg-[#111827]" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: ACCENT }}>
          <span className="text-white font-bold text-sm">Rating Legend</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        <div className={`p-4 space-y-2 divide-y ${panelBorder}`}>
          {HOLISTIC_LEVELS.slice()
            .reverse()
            .map((level) => (
              <div key={level.value} className="flex items-center gap-3 pt-2 first:pt-0">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{ background: level.color }}
                >
                  {level.value}
                </span>
                <span className={`font-bold text-sm ${textPrimary}`}>{level.label}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}