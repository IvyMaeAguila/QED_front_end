import { useEffect, useState } from "react";
import { statsConfig } from "../data/Dashboarddata";
import { DashboardService } from "../services/totalCounts.service";
import type { DashboardCounts } from "../services/totalCounts.service";

interface StatCardsProps {
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
}

export function StatCards({ panelBg, panelBorder, textPrimary }: StatCardsProps) {
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    DashboardService.getDashboardCounts()
      .then(setCounts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const valueFor = (key: keyof DashboardCounts) => {
    if (loading) return "...";
    if (error) return "—";
    return counts?.[key] ?? 0;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {statsConfig.map(({ key, label, Icon }) => (
        <div
          key={key}
          className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${panelBg} ${panelBorder}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#8B0D0D" }}>
              {label}
            </p>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#8B0D0D" }}
            >
              <Icon size={20} className="text-white" />
            </div>
          </div>
          <p className={`mt-2 text-4xl font-black leading-none tracking-tight tabular-nums ${textPrimary}`}>
            {valueFor(key)}
          </p>
        </div>
      ))}
    </div>
  );
}