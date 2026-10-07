import { ArrowUpRight } from "lucide-react";

export interface StatItem {
  label: string;
  value: string | number;
  unit?: string; 
  variant?: "primary" | "default"; 
  onClick?: () => void;
}

interface StatCardsProps {
  stats: StatItem[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function StatCards({ stats, panelBg, panelBorder, textPrimary, textMuted }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {stats.map(({ label, value, unit, variant = "default", onClick }) => {
        const isPrimary = variant === "primary";
        const clickable = Boolean(onClick);
        const Tag = clickable ? "button" : "div";

        return (
          <Tag
            key={label}
            onClick={onClick}
            className={`group relative rounded-table p-4 text-left transition-all sm:p-5 ${
              clickable ? "cursor-pointer active:scale-[0.98]" : ""
            } ${isPrimary ? "text-white" : `border ${panelBg} ${panelBorder} hover:-translate-y-0.5`}`}
            style={{
              boxShadow: isPrimary
                ? "0 12px 28px rgba(85,0,0,0.25)"
                : "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)",
              background: isPrimary ? "linear-gradient(180deg, #550000 0%, #BB0000 100%)" : undefined,
            }}
          >
            {clickable && (
              <ArrowUpRight
                size={15}
                className="absolute right-4 top-4 opacity-30 transition-opacity group-hover:opacity-100"
                style={{ color: isPrimary ? "#fff" : "#8B0D0D" }}
              />
            )}

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
                  className={`text-3xl font-black leading-none tracking-tight tabular-nums ${
                    isPrimary ? "text-white" : textPrimary
                  }`}
                >
                  {value}
                </p>
                {unit && (
                  <p
                    className={`text-sm font-medium ${isPrimary ? "text-white/70" : textMuted}`}
                  >
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
