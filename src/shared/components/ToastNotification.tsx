export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const ACCENT = "var(--color-maroon)";

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: number) => void;
  darkMode: boolean;
}

export function ToastContainer({ toasts, onClose, darkMode }: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[110] flex flex-col items-end gap-2.5 sm:left-auto sm:right-5">
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

  const cardClasses = `pointer-events-auto w-full max-w-sm rounded-xl border shadow-lg px-4 py-3.5 flex items-start gap-3 motion-safe:animate-[toast-in_0.2s_ease-out] ${
    darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-border-subtle"
  }`;

  const iconColor = iconColors[toast.type];

  return (
    <div className={cardClasses} role={toast.type === 'error' ? 'alert' : 'status'} aria-atomic="true">
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
        style={{ background: iconColor }}
      >
        {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "i"}
      </div>
      <p className={`qed-type-body flex-1 pt-0.5 ${darkMode ? "text-white" : "text-[#111827]"}`}>
        {toast.message}
      </p>
      <button
        onClick={onClose}
        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
          darkMode ? "text-[#9CA3AF] hover:bg-white/10 hover:text-white" : "text-[#9CA3AF] hover:bg-brand-light hover:text-[#374151]"
        }`}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}
