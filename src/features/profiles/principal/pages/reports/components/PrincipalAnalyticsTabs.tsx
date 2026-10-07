import { NavLink } from "react-router-dom";
import { BarChart3, HeartPulse } from "lucide-react";

interface PrincipalAnalyticsTabsProps {
  textMuted: string;
}

const TABS = [
  { to: "/principal/reports", label: "Subject Performance", Icon: BarChart3 },
  { to: "/principal/holistic-performance-analytics", label: "Holistic Development", Icon: HeartPulse },
];

// Shared by AnalyticsPage and HolisticPerformanceAnalyticsPage so the switcher
// behaves like real navigation (routes + browser history) instead of local tab state.
export function PrincipalAnalyticsTabs({ textMuted }: PrincipalAnalyticsTabsProps) {
  return (
    <nav aria-label="Report type" className="flex min-w-0 flex-wrap items-center gap-1">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs transition-colors ${
            isActive
              ? "bg-[#880000] font-bold text-white shadow-sm"
              : `font-medium ${textMuted} hover:bg-[#880000] hover:text-white`
          }`}
        >
          <tab.Icon size={13} />
          <span className="truncate">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
