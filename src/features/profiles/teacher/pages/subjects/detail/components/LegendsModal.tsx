import { X } from "lucide-react";
import { HOLISTIC_LEVELS } from "../types/Grading";

interface LegendsModalProps {
  onClose: () => void;
  darkMode: boolean;
  panelBorder: string;
  textPrimary: string;
}

export function LegendsModal({ onClose, darkMode, panelBorder, textPrimary }: LegendsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div
        className={`w-full max-w-md overflow-hidden rounded-2xl border border-t-4 border-t-[#800000] shadow-xl ${darkMode ? "border-white/10 bg-[#2A1A18]" : "border-black/10 bg-white"}`}
        style={{ borderTopColor: "#800000" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between border-b px-5 py-4 ${panelBorder}`}>
          <span className={`text-sm font-bold ${textPrimary}`}>Rating Legend</span>
          <button
            onClick={onClose}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${darkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-500 hover:bg-black/5"}`}
          >
            <X size={16} />
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
