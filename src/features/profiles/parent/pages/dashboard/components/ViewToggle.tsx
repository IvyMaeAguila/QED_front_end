import { LayoutGrid, Rows3 } from "lucide-react";
import type { CardViewMode } from "../types/student";

interface ViewToggleProps {
  view: CardViewMode;
  onChange: (view: CardViewMode) => void;
}

// Single toggle button, not a button group: in grid view it shows the
// "switch to list" icon, in list view it shows the "switch to grid" icon.
export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  const isGrid = view === "grid";

  return (
    <button
      onClick={() => onChange(isGrid ? "list" : "grid")}
      aria-label={isGrid ? "Switch to list view" : "Switch to grid view"}
      title={isGrid ? "Switch to list view" : "Switch to grid view"}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-maroon-dark text-white transition-colors hover:bg-maroon"
    >
      {isGrid ? <Rows3 size={16} /> : <LayoutGrid size={16} />}
    </button>
  );
}
