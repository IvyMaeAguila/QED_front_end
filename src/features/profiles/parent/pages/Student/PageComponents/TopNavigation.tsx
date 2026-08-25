import { LayoutDashboard, BookOpen, FileBarChart, UserCircle } from "lucide-react";

export type StudentDetailTab = "overview" | "academic" | "progressReport" | "studentProfile";

const TABS: { key: StudentDetailTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "academic", label: "Academic", icon: BookOpen },
  { key: "progressReport", label: "Progress Report", icon: FileBarChart },
  { key: "studentProfile", label: "Student Profile", icon: UserCircle },
];

interface TabNavProps {
  active: StudentDetailTab;
  onChange: (tab: StudentDetailTab) => void;
  darkMode: boolean;
  textPrimary: string;
  textMuted: string;
}

export function TabNav({ active, onChange, darkMode, textPrimary, textMuted }: TabNavProps) {
  return (
    <div
      className={`flex items-stretch gap-1 overflow-x-auto rounded-xl p-1.5 ${darkMode ? "bg-white/5" : "bg-[#F1F2F4]"}`}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 h-11 text-sm transition-all ${
              isActive
                ? `font-bold ${textPrimary} ${darkMode ? "bg-white/10" : "bg-white"} shadow-sm`
                : `font-medium ${textMuted} ${darkMode ? "hover:text-white" : "hover:text-[#374151]"}`
            }`}
          >
            <tab.icon size={16} className="shrink-0" />
            <span className="hidden truncate sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}