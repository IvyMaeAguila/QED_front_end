import { ArrowUpRight } from "lucide-react";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";

export interface StatItem {
  label: string;
  value: string | number;
  unit?: string; 
  variant?: "primary" | "default"; 
  onClick?: () => void;
}

interface StatCardsProps {
  loading?: boolean;
  stats: StatItem[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function StatCards({ stats, panelBg, panelBorder, textPrimary, textMuted, loading = false }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" data-sk-region="statcards-div-field-1">
      {stats.map(({ label, value, unit, variant = "default", onClick }) => {
        const isPrimary = variant === "primary";
        const clickable = Boolean(onClick);
        const Tag = clickable ? "button" : "div";

        return (
          <Tag
            key={label}
            data-sk-fixed-region={`teacher/stat/${label}`}
            onClick={onClick}
            className={`group relative rounded-table p-4 text-left transition-[opacity,transform] sm:p-5 ${isPrimary ? "sk-surface-brand" : ""} ${
              clickable ? "cursor-pointer active:scale-[0.98]" : ""
            } ${isPrimary ? "text-white" : `border ${panelBg} ${panelBorder} hover:-translate-y-0.5`}`}
            style={{
              boxShadow: isPrimary
                ? "var(--shadow-primary)"
                : "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)",
              background: isPrimary ? "var(--color-maroon)" : undefined,
            }}
          >
            {clickable && (
              <ArrowUpRight
                size={15}
                className="absolute right-4 top-4 opacity-30 transition-opacity group-hover:opacity-100"
                style={{ color: isPrimary ? "#fff" : "var(--color-maroon)" }}
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
                  <LoadingRegion name={`stat-value-${label}`} as="span" loading={loading} skeleton={<SkeletonText width="2ch"/>}>{value}</LoadingRegion>
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

