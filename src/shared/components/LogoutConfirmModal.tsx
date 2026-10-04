import { useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";

interface LogoutConfirmModalProps {
  darkMode: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ darkMode, onCancel, onConfirm }: LogoutConfirmModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return createPortal((
    <div
      className="modal-backdrop fixed inset-0 z-[120] flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        aria-describedby="logout-confirm-description"
        className={`w-full max-w-sm overflow-hidden rounded-[12px] border border-t-4 border-t-[#800000] shadow-2xl ${darkMode ? "border-[#374151] bg-[#111827]" : "border-[#E5E7EB] bg-white"}`}
      >
        <div className="flex flex-col items-center px-6 pb-5 pt-6 text-center">
          <span className={`flex h-12 w-12 items-center justify-center rounded-full ${darkMode ? "bg-white/5 text-[#D1D5DB]" : "bg-[#F3F4F6] text-[#800000]"}`}>
            <LogOut size={21} />
          </span>
          <h2 id="logout-confirm-title" className={`mt-4 text-base font-bold ${darkMode ? "text-white" : "text-[#111827]"}`}>
            Log out?
          </h2>
          <p id="logout-confirm-description" className={`mt-1 text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
            Are you sure you want to log out of your account?
          </p>
        </div>
        <div className={`flex gap-3 border-t p-4 ${darkMode ? "border-[#374151]" : "border-[#E5E7EB]"}`}>
          <button
            type="button"
            onClick={onCancel}
            className={`h-10 flex-1 rounded-lg border text-sm font-semibold transition-colors ${darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/5" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F8FAFC]"}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 flex-1 rounded-lg bg-[#8B0D0D] text-sm font-semibold text-white transition-colors hover:bg-[#6B0000]"
          >
            Log out
          </button>
        </div>
      </section>
    </div>
  ), document.body);
}
