import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface AdminFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: ReactNode;
  darkMode?: boolean;
  children?: ReactNode;
}

// Self-contained modal for the admin side. Deliberately does NOT reuse the
// parent-portal Modal component — that one depends on theme classes
// (rounded-xl2, shadow-panel, text-maroon-dark, bg-surface, etc.) that are
// specific to the parent theme and aren't guaranteed to exist in the admin
// build, which is why it looked broken here. This one only uses plain
// Tailwind + the same inline color pattern already used elsewhere in
// UserFormPage (ACCENT, darkMode-conditional bg/border classes).
export default function AdminFeedbackModal({
  open,
  onClose,
  title,
  message,
  icon,
  darkMode = false,
  children,
}: AdminFeedbackModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const panelBg = darkMode ? "bg-[#0B1120]" : "bg-white";
  const panelBorder = darkMode ? "border-[#374151]" : "border-[#E5E7EB]";
  const titleColor = darkMode ? "text-white" : "text-[#111827]";
  const messageColor = darkMode ? "text-[#D1D5DB]" : "text-[#374151]";
  const closeBtn = darkMode
    ? "rounded-full p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
    : "rounded-full p-1 text-gray-400 transition-colors hover:bg-[#F6F7FB] hover:text-[#111827]";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-xl border shadow-xl overflow-hidden ${panelBg} ${panelBorder}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${panelBorder}`}>
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-[#8B0D0D] bg-[#8B0D0D]/10">
                {icon}
              </span>
            )}
            <h2 className={`text-sm font-bold ${titleColor}`}>{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className={closeBtn}>
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className={`text-xs font-semibold leading-relaxed ${messageColor}`}>
            {message}
          </p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}