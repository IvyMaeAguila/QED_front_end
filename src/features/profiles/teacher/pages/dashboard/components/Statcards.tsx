import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

export interface StatItem {
  label: string;
  value: string | number;
  unit?: string; 
  Icon: LucideIcon;
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

const ICON_TINTS = ["#8B0D0D", "#A31515", "#6B0000"];

export function StatCards({ stats, panelBg, panelBorder, textPrimary, textMuted }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {stats.map(({ label, value, unit, Icon, variant = "default", onClick }, i) => {
        const isPrimary = variant === "primary";
        const clickable = Boolean(onClick);
        const Tag = clickable ? "button" : "div";
        const tint = ICON_TINTS[i % ICON_TINTS.length];

        return (
          <Tag
            key={label}
            onClick={onClick}
            className={`group text-left rounded-2xl p-7 transition-all ${
              clickable ? "cursor-pointer active:scale-[0.98]" : ""
            } ${isPrimary ? "text-white" : `border ${panelBg} ${panelBorder} hover:-translate-y-0.5`}`}
            style={{
              boxShadow: isPrimary
                ? "0 12px 28px rgba(85,0,0,0.25)"
                : "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)",
              background: isPrimary ? "linear-gradient(180deg, #550000 0%, #BB0000 100%)" : undefined,
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors"
                style={{
                  background: isPrimary ? "rgba(255,255,255,0.18)" : `${tint}1A`,
                  color: isPrimary ? "#fff" : tint,
                }}
              >
                <Icon size={26} />
              </div>
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
                  className={`text-[38px] font-black leading-none tracking-tight tabular-nums ${
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