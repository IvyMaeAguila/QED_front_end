import { ChartNoAxesColumnIncreasing, Check, AlertTriangle } from "lucide-react";
import { ModalFrame } from "@shared/components/modal";

export function ExportProgressModal({ state, darkMode, onClose, label = "class record", format = "Excel", error }: {
  state: "idle" | "loading" | "success" | "error";
  label?: string;
  format?: string;
  error?: string;
  darkMode: boolean;
  onClose: () => void;
}) {
  const done = state === "success";
  const settled = done || state === "error";
  return <ModalFrame open={state !== "idle"} onClose={onClose} size="sm"
    zIndexClass="z-[100]" closeOnBackdrop={settled} closeOnEscape={settled}
    ariaLabel={`Export ${label}`} shellVariant={darkMode ? "dark" : "standard"}
    className="overflow-hidden rounded-2xl">
    <div className={`px-5 py-8 text-center sm:px-8 sm:py-10 ${darkMode ? "bg-panel-dark text-white" : "bg-white text-gray-900"}`}>
      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${darkMode ? "text-white/60" : "text-gray-500"}`}>QED · {label}</span>
      <div aria-hidden="true" className="relative mx-auto my-6 grid size-36 place-items-center sm:size-44" style={{ color: "var(--brand-ink)" }}>
        <div className="absolute inset-0 rounded-full border border-current opacity-10" />
        <div className="absolute inset-3 rounded-full border-[3px] border-current opacity-10" />
        {!settled && <div className="absolute inset-3 rounded-full border-[3px] border-transparent border-t-current border-r-current motion-safe:animate-spin" style={{ animationDuration: "1.6s" }} />}
        <div className="grid size-20 place-items-center rounded-full bg-maroon text-white shadow-lg sm:size-24">
          {done ? <Check size={36} strokeWidth={2.5} /> : state === 'error' ? <AlertTriangle size={32} /> : <ChartNoAxesColumnIncreasing size={32} className="motion-safe:animate-pulse" />}
        </div>
      </div>
      <div role="status" aria-live="polite" aria-atomic="true">
        <h2 className="text-xl font-bold sm:text-2xl">{state === "error" ? "Export could not finish" : done ? `Your ${label} is ready` : `Preparing your ${label}`}</h2>
        <p className={`mx-auto mt-3 max-w-64 text-sm leading-relaxed ${darkMode ? "text-white/60" : "text-gray-500"}`}>
          {state === "error" ? error || "Please try exporting again." : done ? `Your ${format} download has started. Check your downloads to open the file.` : `Please wait a moment while we prepare your ${label}.`}
        </p>
      </div>
      {settled ? <button type="button" onClick={onClose} className="mt-6 min-h-11 w-full rounded-xl bg-maroon px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto">{done ? "Done" : "Close"}</button>
        : <p className={`mt-6 text-xs ${darkMode ? "text-white/45" : "text-gray-400"}`}>This may take a few moments</p>}
    </div>
  </ModalFrame>;
}
