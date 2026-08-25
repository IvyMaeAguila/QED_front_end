// EmptyState.tsx
import type { LucideIcon } from "lucide-react";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout"; // adjust path as needed

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  theme: AdminThemeContext;
}

export default function EmptyState({ icon: Icon, message, theme }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-xl py-10 text-center ${theme.darkMode ? "bg-[#1F2937]" : "bg-gray-50"}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm ${theme.darkMode ? "bg-[#111827]" : "bg-white"}`}>
        <Icon size={16} color={theme.darkMode ? "#9CA3AF" : "#6B7280"} />
      </div>
      <p className={`max-w-[220px] text-xs leading-relaxed ${theme.textMuted}`}>{message}</p>
    </div>
  );
}