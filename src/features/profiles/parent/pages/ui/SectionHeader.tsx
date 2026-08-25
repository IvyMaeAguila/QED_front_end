// SectionHeader.tsx
import { useState } from "react";
import { Info, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { COLORS } from "../Student/Overview/utils/constants";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout"; // adjust path as needed

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  about?: string;
  action?: ReactNode;
  theme: AdminThemeContext;
}

export default function SectionHeader({
  icon: Icon,
  title,
  about,
  action,
  theme,
}: SectionHeaderProps) {
  const [showInfo, setShowInfo] = useState(false);
  const { darkMode, panelBorder, panelBg, textPrimary, textMuted } = theme;

  const hasAbout = Boolean(about && about.trim().length > 0);

  return (
    <div
      className={`relative flex items-center justify-between gap-2 border-b px-5 py-4 ${panelBorder}`}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} color={darkMode ? "#F87171" : COLORS.maroonDark} />
        <h3
          className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}
        >
          {title}
        </h3>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {action}
        {hasAbout && (
          <button
            type="button"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            onClick={() => setShowInfo((s) => !s)}
            className={`shrink-0 rounded-full ${textMuted} hover:opacity-80`}
            aria-label={`About ${title}`}
          >
            <Info size={15} />
          </button>
        )}
      </div>

      {hasAbout && showInfo && (
        <div
          className={`absolute right-4 top-11 z-10 w-64 rounded-lg border p-3 text-xs leading-relaxed shadow-lg ${panelBorder} ${panelBg} ${textMuted}`}
        >
          {about}
        </div>
      )}
    </div>
  );
}