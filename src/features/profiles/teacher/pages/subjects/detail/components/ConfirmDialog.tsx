import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  darkMode: boolean;
}

const ACCENT = "#6B0000";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  danger = true,
  onConfirm,
  onCancel,
  darkMode,
}: ConfirmDialogProps) {
  const textPrimary = darkMode ? "text-white" : "text-[#111827]";
  const textMuted = darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40" onClick={onCancel}>
      <div
        className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl ${darkMode ? "bg-[#111827]" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: danger ? "#FEE2E2" : "#F8EDEE", color: danger ? "#DC2626" : ACCENT }}
            >
              <AlertTriangle size={18} />
            </span>
            <div className="min-w-0">
              <h3 className={`font-extrabold ${textPrimary}`}>{title}</h3>
              <p className={`mt-1 text-xs font-medium ${textMuted}`}>{message}</p>
            </div>
            <button onClick={onCancel} className={`ml-auto shrink-0 ${textMuted}`} aria-label="Cancel">
              <X size={16} />
            </button>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onCancel}
              className={`h-10 rounded-xl border px-4 text-xs font-bold ${
                darkMode ? "border-[#374151] text-[#D1D5DB]" : "border-[#E5E7EB] text-[#374151]"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="h-10 rounded-xl px-4 text-xs font-extrabold text-white transition-opacity hover:opacity-90"
              style={{ background: danger ? "#DC2626" : ACCENT }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}