export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const ACCENT = "#8B0D0D";

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: number) => void;
  darkMode: boolean;
}

export function ToastContainer({ toasts, onClose, darkMode }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 items-end">
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          darkMode={darkMode}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  darkMode,
  onClose,
}: {
  toast: ToastItem;
  darkMode: boolean;
  onClose: () => void;
}) {
  const iconColors: Record<ToastType, string> = {
    success: "#059669",
    error: ACCENT,
    info: "#1D70D6",
  };

  const cardClasses = `min-w-[260px] max-w-sm rounded-xl border shadow-lg px-4 py-3.5 flex items-start gap-3 animate-[toast-in_0.2s_ease-out] ${
    darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-[#E5E7EB]"
  }`;

  const iconColor = iconColors[toast.type];

  return (
    <div className={cardClasses} role="status">
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
        style={{ background: iconColor }}
      >
        {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "i"}
      </div>
      <p className={`text-sm font-semibold flex-1 pt-0.5 ${darkMode ? "text-white" : "text-[#111827]"}`}>
        {toast.message}
      </p>
      <button
        onClick={onClose}
        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
          darkMode ? "text-[#9CA3AF] hover:bg-white/10 hover:text-white" : "text-[#9CA3AF] hover:bg-[#F6F7FB] hover:text-[#374151]"
        }`}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}