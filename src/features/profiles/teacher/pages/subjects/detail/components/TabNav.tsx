import { ClipboardCheck, BookOpen, GraduationCap, FileText, Sparkles } from "lucide-react";

export type SubjectDetailTab = "attendance" | "writtenWorks" | "performanceTask" | "exams" | "holistic";

const TABS: { key: SubjectDetailTab; label: string; icon: typeof ClipboardCheck }[] = [
  { key: "attendance", label: "Attendance", icon: ClipboardCheck },
  { key: "writtenWorks", label: "Written Works", icon: BookOpen },
  { key: "performanceTask", label: "Performance Task", icon: GraduationCap },
  { key: "exams", label: "Exams", icon: FileText },
  { key: "holistic", label: "Holistic", icon: Sparkles },
];

interface TabNavProps {
  active: SubjectDetailTab;
  onChange: (tab: SubjectDetailTab) => void;
  darkMode: boolean;
  textPrimary: string;
  textMuted: string;
}

export function TabNav({ active, onChange, darkMode, textPrimary, textMuted }: TabNavProps) {
  return (
    <div
      className={`flex items-stretch gap-1 rounded-xl p-1.5 ${darkMode ? "bg-white/5" : "bg-[#F1F2F4]"}`}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-lg text-sm transition-all ${
              isActive
                ? `font-bold ${textPrimary} ${darkMode ? "bg-white/10" : "bg-white"} shadow-sm`
                : `font-medium ${textMuted} hover:${darkMode ? "text-white" : "text-[#374151]"}`
            }`}
          >
            <tab.icon size={16} />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}