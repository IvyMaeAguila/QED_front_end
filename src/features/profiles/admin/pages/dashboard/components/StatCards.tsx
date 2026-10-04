import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { statsConfig } from "../data/Dashboarddata";
import { DashboardService } from "../services/totalCounts.service";
import type { DashboardCounts } from "../services/totalCounts.service";

interface StatItem {
  label: string;
  value: string | number;
  unit?: string;
  variant?: "primary" | "default";
  onClick?: () => void;
}

interface StatCardsProps {
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function StatCards({ panelBg, panelBorder, textPrimary, textMuted }: StatCardsProps) {
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

  const stats: StatItem[] = statsConfig.map(({ key, label }, i) => ({
    label,
    value: valueFor(key),
    variant: i === 0 ? "primary" : "default",
  }));

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, unit, variant = "default", onClick }) => {
        const isPrimary = variant === "primary";
        const clickable = Boolean(onClick);
        const Tag = clickable ? "button" : "div";

        return (
          <Tag
            key={label}
            onClick={onClick}
            className={`group rounded-table p-4 text-left transition-all sm:p-5 ${
              clickable ? "cursor-pointer active:scale-[0.98]" : ""
            } ${isPrimary ? "text-white" : `border ${panelBg} ${panelBorder} hover:-translate-y-0.5`}`}
            style={{
              boxShadow: isPrimary
                ? "0 12px 28px rgba(85,0,0,0.25)"
                : "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)",
              background: isPrimary ? "linear-gradient(180deg, #550000 0%, #BB0000 100%)" : undefined,
            }}
          >
            <div className="mb-4 flex justify-end sm:mb-5">
              {clickable && (
                <ArrowUpRight
                  size={18}
                  className="opacity-30 group-hover:opacity-100 transition-opacity"
                  style={{ color: isPrimary ? "#fff" : "#8B0D0D" }}
                />
              )}
            </div>

            <div>
              <p
                className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                  isPrimary ? "text-white/75" : textMuted
                }`}
              >
                {label}
              </p>
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-3xl font-black leading-none tracking-tight tabular-nums sm:text-[36px] ${
                    isPrimary ? "text-white" : textPrimary
                  }`}
                >
                  {value}
                </p>
                {unit && (
                  <p className={`text-sm font-medium ${isPrimary ? "text-white/70" : textMuted}`}>
                    {unit}
                  </p>
                )}
              </div>
            </div>
          </Tag>
        );
      })}
    </div>
  );
}
