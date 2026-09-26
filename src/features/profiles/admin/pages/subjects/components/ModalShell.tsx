import { X } from "lucide-react";
import { ACCENT, type SubjectsTheme } from "../types/types";

interface ModalShellProps extends SubjectsTheme {
  title: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  onClose: () => void;
  children: React.ReactNode;
  closeDisabled?: boolean;
}

export function ModalShell({
  title,
  icon: Icon,
  onClose,
  children,
  panelBg,
  panelBorder,
  closeDisabled = false,
}: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/40"
      onClick={closeDisabled ? undefined : onClose}
    >
      <div
        className={`my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-xl ${panelBg} ${panelBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between overflow-hidden rounded-t-2xl px-5 py-4"
          style={{ background: ACCENT }}
        >
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Icon size={15} />
            {title}
          </h3>

          <button
            onClick={closeDisabled ? undefined : onClose}
            disabled={closeDisabled}
            className={`w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 transition-colors ${
              closeDisabled
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-white/20"
            }`}
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
