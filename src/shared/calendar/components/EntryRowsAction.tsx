import { Pencil, Trash2 } from "lucide-react";

interface EntryRowActionsProps {
  darkMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  /** True kapag nasa maroon background ang row (hal. entry na ngayong araw) */
  highlighted?: boolean;
}

export function EntryRowActions({ darkMode, onEdit, onDelete, highlighted = false }: EntryRowActionsProps) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={onEdit}
        aria-label="Edit entry"
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
          highlighted
            ? "text-white hover:bg-white/15"
            : darkMode
              ? "hover:bg-white/10 text-[#D1D5DB]"
              : "hover:bg-[#F6F7FB] text-[#374151]"
        }`}
      >
        <Pencil size={13} />
      </button>
      <button
        onClick={onDelete}
        aria-label="Delete entry"
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
          highlighted
            ? "text-white hover:bg-white/15"
            : "text-[#B91C1C] hover:bg-[#FDF2F2]"
        }`}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}