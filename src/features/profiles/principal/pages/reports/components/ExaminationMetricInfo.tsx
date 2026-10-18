import { useId, useRef, useState } from "react";
import { useRouteEffect } from "@shared/loading/RoutePreview";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

interface Props {
  label: string;
  term: string;
  explanation: string;
  calculation: string;
  darkMode: boolean;
}

/** Uses the same fixed, body-portal positioning as QED's account popovers. */
export function ExaminationMetricInfo({ label, term, explanation, calculation, darkMode }: Props) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top?: number; bottom?: number; width: number; maxHeight: number }>({ left: 8, top: 8, width: 280, maxHeight: 220 });
  function cancelClose() { clearTimeout(closeTimer.current); }
  function show() {
    cancelClose();
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(280, window.innerWidth - 16);
    const below = window.innerHeight - rect.bottom - 14;
    const above = rect.top - 14;
    const upwards = below < 220 && above > below;
    setPosition({
      width, left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      ...(upwards ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
      maxHeight: Math.max(48, upwards ? above : below),
    });
    setOpen(true);
  }
  function hide() { cancelClose(); setOpen(false); }
  function leave() {
    if (document.activeElement !== trigger.current) closeTimer.current = setTimeout(() => setOpen(false), 120);
  }
  useRouteEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!trigger.current?.contains(event.target as Node) && !tooltip.current?.contains(event.target as Node)) hide();
    }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") hide(); }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", hide);
    window.addEventListener("scroll", hide, true);
    return () => {
      cancelClose();
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", hide);
      window.removeEventListener("scroll", hide, true);
    };
  }, [open]);
  return <>
    <button ref={trigger} type="button" aria-label={`About ${label}`} aria-describedby={id}
      onPointerEnter={event => { if (event.pointerType === "mouse") show(); }} onPointerLeave={leave}
      onFocus={show} onBlur={hide} onClick={show}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
      <Info size={13} aria-hidden="true" />
    </button>
    <span id={id} className="sr-only">{term}. {explanation} Calculation: {calculation}</span>
    {open && createPortal(<div ref={tooltip} role="tooltip" onPointerEnter={cancelClose} onPointerLeave={leave}
      style={{ position: "fixed", zIndex: 10000, ...position }}
      className={`overflow-y-auto rounded-lg border p-3 text-xs leading-relaxed shadow-lg ${darkMode ? "border-gray-600 bg-gray-900 text-gray-100" : "border-gray-200 bg-white text-gray-800"}`}>
      <p className="font-semibold">{term}</p>
      <p className="mt-1">{explanation}</p>
      <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Calculation: {calculation}</p>
    </div>, document.body)}
  </>;
}
