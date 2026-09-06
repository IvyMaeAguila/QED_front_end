import { NavLink } from "react-router-dom";

interface PrincipalAnalyticsTabsProps {
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

const TABS = [
  { to: "/principal/reports", label: "Subject Performance" },
  { to: "/principal/holistic-performance-analytics", label: "Holistic Development" },
];

// Shared by AnalyticsPage and HolisticPerformanceAnalyticsPage so the switcher
// behaves like real navigation (routes + browser history) instead of local tab state.
export function PrincipalAnalyticsTabs({ panelBorder, textPrimary, textMuted }: PrincipalAnalyticsTabsProps) {
  return (
    <div className={`flex items-center gap-7 border-b ${panelBorder}`}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `relative pb-3 text-sm font-bold transition-colors ${isActive ? textPrimary : textMuted}`}
          onMouseEnter={(e) => {
            if (!e.currentTarget.classList.contains(textPrimary)) {
              e.currentTarget.style.opacity = "0.75";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "";
          }}
        >
          {({ isActive }) => (
            <>
              {tab.label}
              {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full" style={{ backgroundColor: "var(--color-red)" }} />}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
