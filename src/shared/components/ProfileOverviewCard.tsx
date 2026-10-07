import type { ReactNode } from "react";

export interface ProfileOverviewStat {
  label: string;
  value: ReactNode;
}

export interface ProfileOverviewTab {
  id: string;
  label: string;
  count?: number;
}

interface ProfileOverviewCardProps {
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
  avatarBorderColor: string;
  avatar: ReactNode;
  name: string;
  subtitle: string;
  identityDetails?: ReactNode;
  stats: ProfileOverviewStat[];
  tabs: ProfileOverviewTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  label: string;
  actions?: ReactNode;
}

export function ProfileOverviewCard({
  panelBg, panelBorder, textPrimary, textMuted, darkMode, avatarBorderColor,
  avatar, name, subtitle, identityDetails, stats, tabs, activeTab, onTabChange, label, actions,
}: ProfileOverviewCardProps) {
  return (
    <section className={`overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`} aria-label={label}>
      <div className="h-28 bg-maroon-gradient-vertical sm:h-36" />
      <div className="px-4 sm:px-6">
        <div className="-mt-9 flex flex-col items-center text-center">
          <div className={`flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-full border-2 text-xl font-black shadow-sm sm:h-20 sm:w-20 ${panelBg} ${panelBorder} ${textPrimary}`} style={{ borderColor: avatarBorderColor }}>
            {avatar}
          </div>
          <h2 className={`mt-2 text-lg font-bold tracking-tight sm:text-xl ${textPrimary}`}>{name}</h2>
          <p className={`mt-0.5 text-xs ${textMuted}`}>{subtitle}</p>
          {identityDetails}
        </div>

        <div className={`mt-4 grid grid-cols-1 divide-y divide-slate-200 border-y py-1 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-white/10 ${panelBorder}`}>
          {stats.slice(0, 3).map((stat) => (
            <div key={stat.label} className="min-w-0 px-3 py-2 sm:px-4">
              <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>{stat.label}</p>
              <p className={`truncate text-xs font-semibold ${textPrimary}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`mt-4 flex items-center gap-2 border-t px-5 sm:px-8 ${panelBorder} ${darkMode ? "bg-white/[0.03]" : "bg-[#F8FAFC]"}`} role="tablist" aria-label={`${label} sections`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors ${activeTab === tab.id ? "border-maroon text-maroon" : `border-transparent ${textMuted} hover:text-maroon`}`}
          >
            {tab.label}
            {tab.count !== undefined && <span className={`rounded-full px-1.5 py-0.5 text-xs ${darkMode ? "bg-white/10" : "bg-black/[0.05]"}`}>{tab.count}</span>}
          </button>
        ))}
        {actions && <div className="ml-auto py-1.5">{actions}</div>}
      </div>
    </section>
  );
}
