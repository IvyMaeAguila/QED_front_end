// StatBox.tsx
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout"; // adjust path as needed

interface StatBoxProps {
  label: string;
  value: number;
  color: string;
  theme: AdminThemeContext;
}

export default function StatBox({ label, value, color, theme }: StatBoxProps) {
  return (
    <div className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-4 ${theme.darkMode ? "bg-[#1F2937]" : "bg-gray-50"}`}>
      <span className="text-2xl font-extrabold" style={{ color }}>{value}</span>
      <span className={`text-[11px] font-semibold tracking-wide ${theme.textMuted}`}>{label}</span>
    </div>
  );
}