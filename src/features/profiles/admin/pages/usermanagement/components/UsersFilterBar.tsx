import { useRef, useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export function Dropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  darkMode,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
  darkMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function updatePosition() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 4, left: rect.left });
  }

  useEffect(() => {
    if (!open) return;
    updatePosition();

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`h-8 min-w-32 px-3 rounded-lg border text-xs font-bold flex items-center justify-between gap-2 transition-colors ${
          darkMode
            ? "bg-[#0B1120] border-[#374151] text-white hover:bg-[#111827]"
            : "bg-brand-light border-border-subtle text-[#111827] hover:bg-brand-light"
        }`}
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
            className={`w-44 rounded-xl border p-1 shadow-lg ${
              darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-border-subtle"
            }`}
          >
            {options.map((option) => (
              <button
                key={option}
                role="option"
                aria-selected={value === option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                  darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#374151] hover:bg-brand-light"
                }`}
              >
                {option}
                {value === option && <Check size={14} className="text-brand-ink" />}
              </button>
            ))}
          </div>,
          document.body
        )}
      <span className="sr-only">{label}</span>
    </div>
  );
}