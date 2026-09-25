import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  widthClass?: string;
  darkMode?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  widthClass = "max-w-md",
  darkMode = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const panelBg = darkMode ? "bg-[#111827]" : "bg-white";
  const headerBorder = darkMode ? "border-[#1F2937]" : "border-surface";
  const titleColor = darkMode ? "text-white" : "text-maroon-dark";
  const subtitleColor = darkMode ? "text-gray-400" : "text-gray-500";
  const iconBg = darkMode ? "bg-maroon/20" : "bg-maroon/10";
  const closeBtn = darkMode
    ? "rounded-full p-1 text-gray-500 transition-colors hover:bg-[#1a1a1a] hover:text-white"
    : "rounded-full p-1 text-gray-400 transition-colors hover:bg-surface hover:text-maroon-dark";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass} rounded-xl2 ${panelBg} shadow-panel overflow-hidden animate-[slideUp_0.18s_ease-out]`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={`flex items-start justify-between gap-3 border-b px-6 py-4 ${headerBorder}`}>
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-maroon-dark ${iconBg}`}>
                {icon}
              </span>
            )}
            <div>
              <h2 className={`text-base font-semibold ${titleColor}`}>{title}</h2>
              {subtitle && (
                <p className={`text-xs ${subtitleColor}`}>{subtitle}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className={closeBtn}>
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}