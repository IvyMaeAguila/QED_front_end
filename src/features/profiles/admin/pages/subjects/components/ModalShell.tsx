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
  widthClass?: string;
}

export function ModalShell({
  title,
  icon: Icon,
  onClose,
  children,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
  closeDisabled = false,
  widthClass = "max-w-md",
}: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4 modal-backdrop"
      onClick={closeDisabled ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`my-auto flex max-h-[88dvh] w-full ${widthClass} flex-col overflow-hidden rounded-[12px] border shadow-xl ${panelBg} ${panelBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: ACCENT }} />
        <div
          className={`flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4 sm:px-8 sm:py-5 ${panelBorder}`}
        >
          <h3 className={`flex min-w-0 items-center gap-2 text-base font-bold ${textPrimary}`}>
            <Icon size={16} className="shrink-0 text-maroon" />
            {title}
          </h3>

          <button
            onClick={closeDisabled ? undefined : onClose}
            disabled={closeDisabled}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${panelBorder} ${textMuted} ${
              closeDisabled
                ? "cursor-not-allowed opacity-40"
                : darkMode ? "hover:bg-white/10" : "hover:bg-black/5"
            }`}
          >
            <X size={16} className="text-current" />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
