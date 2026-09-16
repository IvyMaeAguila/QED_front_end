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
  const panelBorder = darkMode ? "border-white/10" : "border-black/10";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,10,15,0.56)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-sm overflow-hidden rounded-2xl border shadow-card ${panelBorder} ${
          darkMode ? "bg-[#111827]" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-start gap-3 border-b px-4 py-3 ${panelBorder}`}>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: danger ? "#FEE2E2" : "#F8EDEE", color: danger ? "#DC2626" : ACCENT }}
          >
            <AlertTriangle size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-bold ${textPrimary}`}>{title}</p>
            <p className={`mt-0.5 text-[11px] font-medium ${textMuted}`}>{message}</p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cancel"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
              darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#64748B] hover:bg-black/5"
            }`}
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3">
          <button
            onClick={onCancel}
            className={`flex h-8 items-center rounded-lg border px-3 text-[11px] font-bold transition-colors ${
              darkMode
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex h-8 items-center rounded-lg px-3 text-[11px] font-extrabold text-white transition-colors"
            style={{ backgroundColor: danger ? "#DC2626" : "#800000" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = danger ? "#B91C1C" : "#650000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = danger ? "#DC2626" : "#800000";
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}