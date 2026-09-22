// src/features/profiles/shared/components/DashboardUI.tsx
//
// Shared building blocks for dashboard-style pages across every role
// (admin, parent, principal, teacher — all siblings of `shared` under
// profiles/). Any page under profiles/<role>/... can reach this file with
// a relative import that climbs up to profiles/ and back down into
// shared/components/, e.g. from profiles/principal/pages/dashboard/:
//   import { SectionCard } from "../../../shared/components/DashboardUI";
// All colors/shadows/radii come from the app's global @theme tokens (see
// global.css) — nothing here hardcodes hex.
import type { LucideIcon } from "lucide-react";
import { useId } from "react";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ArrowLeft } from "lucide-react";

export type Trend = "up" | "down" | "flat";
export type CardVariant = "spotlight" | "primary" | "alert" | "gold";
export type Shape = "square" | "circle";

// ---------------------------------------------------------------------------
// SectionCard — the standard bordered panel with a compact icon+label
// title and a full-bleed divider underneath.
// ---------------------------------------------------------------------------
export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  panelBg,
  panelBorder,
  textPrimary,
  darkMode,
}: {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  darkMode: boolean;
}) {
  return (
    <div className={`rounded-2xl border ${panelBg} ${panelBorder} p-5 sm:p-6 shadow-card`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className={`flex items-center h-4 gap-1.5 text-xs font-bold uppercase tracking-wide leading-none ${textPrimary}`}>
          {Icon && (
            <span className="inline-flex items-center justify-center h-4 w-4 shrink-0">
              <Icon className="h-3.5 w-3.5 text-maroon" strokeWidth={2.75} />
            </span>
          )}
          <span className="flex items-center h-4">{title}</span>
        </h2>
        {action}
      </div>
      <div
        className="h-px -mx-5 sm:-mx-6 mb-6"
        style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }}
      />
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dropdown — the standard rounded-2xl select with a chevron, used for term/
// grade filters (e.g. in SectionCard's action slot). Pulls its own
// panelBg/panelBorder styling so callers don't have to rebuild the
// select+chevron markup by hand every time a page needs a filter.
// Accepts either a plain string[] or a { label, value }[] when the display
// text needs to differ from the underlying value.
// ---------------------------------------------------------------------------
export function Dropdown({
  value,
  onChange,
  options,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  icon: Icon,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[] | { label: string; value: string }[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  icon?: LucideIcon;
  label?: string;
}) {
  const normalized = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));


  return (
    <div className="relative shrink-0">
      {Icon && (
        <Icon className={`h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none text-sm font-bold rounded-xl border ${panelBorder} ${panelBg} ${textPrimary} shadow-card focus:outline-none focus:ring-2 focus:ring-maroon/40 cursor-pointer ${
          Icon ? "pl-9" : "pl-3.5"
        } pr-9 py-2`}
      >
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            { `${o.label}`}
          </option>
        ))}
      </select>

      <ChevronDown className={`h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
    </div>
  );
}

export function BackButton({
  onClick,
  panelBg,
  panelBorder,
  textPrimary,
}: {
  onClick: () => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-9 w-9 rounded-2xl border ${panelBg} ${panelBorder} flex items-center justify-center shadow-card hover:bg-maroon/5 transition-colors`}
    >
      <ArrowLeft className={`h-4 w-4 ${textPrimary}`} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// TrendChip — small circular up/down/flat indicator.
// ---------------------------------------------------------------------------
export function TrendChip({ trend, darkMode }: { trend: Trend; darkMode: boolean }) {
  const map = {
    up: { Icon: TrendingUp, bg: darkMode ? "var(--color-green-soft-dark)" : "var(--color-green-soft)", color: "var(--color-green)" },
    down: { Icon: TrendingDown, bg: darkMode ? "var(--color-red-soft-dark)" : "var(--color-red-soft)", color: "var(--color-red)" },
    flat: {
      Icon: Minus,
      bg: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
      color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
    },
  } as const;
  const { Icon, bg, color } = map[trend];
  return (
    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full" style={{ backgroundColor: bg, color }}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// ProgressBar — thin maroon fill on a maroon-soft track.
// ---------------------------------------------------------------------------
export function ProgressBar({ value, darkMode }: { value: number; darkMode: boolean }) {
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden"
      style={{ backgroundColor: darkMode ? "var(--color-maroon-soft-dark)" : "var(--color-maroon-soft)" }}
    >
      <div className="h-full rounded-full bg-maroon" style={{ width: `${value}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// OverviewCard — the KPI tile used across dashboard pages. "spotlight" is
// the one-per-page headline gradient card; primary/gold/alert are the
// bordered, theme-aware neutral cards with a tinted icon chip.
// For lighter-weight stats (detail/profile pages, 2-4 short facts), use
// MiniStatRow/MiniStat below instead — OverviewCard is meant to carry
// dashboard-level visual weight.
// ---------------------------------------------------------------------------
const ICON_VARIANT_STYLE: Record<Exclude<CardVariant, "spotlight">, (darkMode: boolean) => { shape: Shape; bg: string; icon: string }> = {
  primary: () => ({ shape: "square", bg: "var(--color-maroon)", icon: "#FFFFFF" }),
  gold: () => ({ shape: "circle", bg: "var(--color-gold)", icon: "#FFFFFF" }),
  alert: (darkMode) => ({
    shape: "square",
    bg: darkMode ? "var(--color-red-soft-dark)" : "var(--color-red-soft)",
    icon: "var(--color-red)",
  }),
};

export function OverviewCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  variant,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  trend?: Trend;
  variant: CardVariant;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}) {
  if (variant === "spotlight") {
    return (
      <div className="rounded-2xl p-7 flex flex-col gap-5 text-white bg-maroon-gradient-vertical shadow-primary">
        <div className="flex items-center justify-between">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/18">
            <Icon className="h-6 w-6 text-white" strokeWidth={2.25} />
          </div>
          {trend && <TrendChip trend={trend} darkMode={false} />}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/75">{label}</p>
          <p className="text-[38px] font-black leading-none tracking-tight tabular-nums mt-1.5">{value}</p>
          <p className="text-xs mt-1.5 text-white/70">{sub}</p>
        </div>
      </div>
    );
  }

  const s = ICON_VARIANT_STYLE[variant](darkMode);
  return (
    <div className={`rounded-2xl border p-7 flex flex-col gap-5 transition-all hover:-translate-y-0.5 shadow-card ${panelBg} ${panelBorder}`}>
      <div className="flex items-center justify-between">
        <div
          className={`w-14 h-14 flex items-center justify-center ${s.shape === "circle" ? "rounded-full" : "rounded-2xl"}`}
          style={{ backgroundColor: s.bg }}
        >
          <Icon className="h-6 w-6" style={{ color: s.icon }} strokeWidth={2.25} />
        </div>
        {trend && <TrendChip trend={trend} darkMode={darkMode} />}
      </div>
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>{label}</p>
        <p className={`text-[38px] font-black leading-none tracking-tight tabular-nums mt-1.5 ${textPrimary}`}>{value}</p>
        <p className={`text-xs mt-1.5 ${textMuted}`}>{sub}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatPanel — OverviewCard's visual punch (icon chip, big tabular number,
// hover lift) but with a children slot so a card can carry more than a
// single metric: a breakdown list, a progress bar, an action link. Use
// OverviewCard for pure KPI tiles; use StatPanel when that same card also
// needs to hold supporting content underneath the number.
// ---------------------------------------------------------------------------
export function StatPanel({
  label,
  value,
  sub,
  icon: Icon,
  variant,
  children,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  variant: Exclude<CardVariant, "spotlight">;
  children?: React.ReactNode;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}) {
  const s = ICON_VARIANT_STYLE[variant](darkMode);
  return (
    <div className={`rounded-2xl border p-5 flex flex-col transition-all hover:-translate-y-0.5 shadow-card ${panelBg} ${panelBorder}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>{label}</p>
          <p className={`text-3xl font-black leading-none tracking-tight tabular-nums mt-2 ${textPrimary}`}>{value}</p>
          <p className={`text-xs mt-1.5 ${textMuted}`}>{sub}</p>
        </div>
        <div
          className={`w-12 h-12 flex items-center justify-center shrink-0 ${s.shape === "circle" ? "rounded-full" : "rounded-2xl"}`}
          style={{ backgroundColor: s.bg }}
        >
          <Icon className="h-5.5 w-5.5" style={{ color: s.icon }} strokeWidth={2.25} />
        </div>
      </div>
      {children && (
        <>
          <div
            className="h-px -mx-5 mt-4 mb-4"
            style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }}
          />
          {children}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MiniStatRow / MiniStat — a compact row of label/value fact pairs side by
// side, separated by thin dividers. Use this instead of OverviewCard when
// the values are short facts (a room name, a section) rather than headline
// dashboard metrics — same color language and border/shadow tokens, at a
// fraction of the size.
// ---------------------------------------------------------------------------
export function MiniStatRow({
  children,
  panelBg,
  panelBorder,
}: {
  children: React.ReactNode;
  panelBg: string;
  panelBorder: string;
}) {
  return <div className={`rounded-2xl border ${panelBg} ${panelBorder} shadow-card flex flex-wrap`}>{children}</div>;
}

export function MiniStat({
  label,
  value,
  icon: Icon,
  textPrimary,
  textMuted,
  darkMode,
  isFirst,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
  isFirst?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-4 flex-1 min-w-35"
      style={isFirst ? undefined : { borderLeft: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}
    >
      {Icon && (
        <span
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
          style={{
            backgroundColor: darkMode ? "var(--color-maroon-soft-dark)" : "var(--color-maroon-soft)",
            color: "var(--color-maroon)",
          }}
        >
          <Icon className="h-4 w-4" strokeWidth={2.5} />
        </span>
      )}
      <div className="min-w-0">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>{label}</p>
        <p className={`text-sm font-bold truncate ${textPrimary}`}>{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FolderCard — an actual folder silhouette (SVG), not just a rotated
// rectangle: the front pocket's top edge dips inward in the middle, and a
// second card sits behind it, poking up through that notch. Deliberately
// minimal: one label, one headline stat, one optional secondary stat.
// Use for a grid of glanceable summary tiles where each tile leads
// somewhere else for the full detail (a grade, a class, a category) —
// not for dashboard KPIs that need to stand alone (use OverviewCard) or
// stats that carry a breakdown underneath (use StatPanel).
// ---------------------------------------------------------------------------
export function FolderCard({
  label,
  value,
  valueLabel,
  secondaryLabel,
  darkMode,
  onClick,
}: {
  label: string;
  value: string;
  valueLabel: string;
  secondaryLabel?: string;
  darkMode: boolean;
  onClick?: () => void;
}) {
  const gradientId = useId();

  return (
    <div
      onClick={onClick}
      className={`relative aspect-square transition-transform duration-200 ${onClick ? "cursor-pointer hover:-translate-y-1" : ""}`}
    >
      {/* card peeking out from behind, visible only through the notch cut
          into the folder's top edge below */}
      <div
        className="absolute left-1/2 top-[4%] h-[46%] w-[36%] -translate-x-1/2 rounded-2xl rotate-[-7deg] shadow-card"
        style={{ backgroundColor: darkMode ? "var(--color-gold-soft-dark)" : "var(--color-gold-soft)" }}
      />

      {/* folder silhouette — rounded rect body with a shallow inward dip
          in the middle of the top edge, forming the pocket opening */}
      <svg viewBox="0 0 200 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-maroon-light)" }} />
            <stop offset="100%" style={{ stopColor: "var(--color-maroon-dark)" }} />
          </linearGradient>
        </defs>
        <path
          d="M36 50 L72 50 Q82 50 88 60 Q94 70 100 70 Q106 70 112 60 Q118 50 128 50 L164 50
             Q182 50 182 68 L182 172 Q182 190 164 190 L36 190 Q18 190 18 172 L18 68 Q18 50 36 50 Z"
          fill={`url(#${gradientId})`}
        />
      </svg>

      {/* text overlay */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-white">
        <p className="text-xs font-bold truncate">{label}</p>
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="text-xl font-black leading-none tracking-tight tabular-nums">{value}</span>
            <span className="text-[10px] font-medium text-white/70 truncate">{valueLabel}</span>
          </div>
          {secondaryLabel && <span className="text-[10px] font-medium text-white/70 shrink-0">{secondaryLabel}</span>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RankBadge — white/dark rounded-square badge with a big number + caption,
// used for the subject ranking list (and reusable anywhere else a small
// "position + label" chip is needed).
// ---------------------------------------------------------------------------
export function RankBadge({ rank, darkMode }: { rank: number; darkMode: boolean }) {
  const color =
    rank === 1
      ? "var(--color-gold)"
      : rank === 2
        ? "var(--color-silver)"
        : rank === 3
          ? "var(--color-bronze)"
          : darkMode
            ? "rgba(255,255,255,0.55)"
            : "rgba(0,0,0,0.45)";

  return (
    <div
      className="h-16 w-16 shrink-0 rounded-2xl flex flex-col items-center justify-center shadow-card"
      style={{ backgroundColor: darkMode ? "#1A1A1A" : "#FFFFFF" }}
    >
      <span className="text-xl font-black leading-none tabular-nums" style={{ color }}>
        {rank}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color }}>
        {rank <= 3 ? "RANK" : `${rank}th`}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HeroActionCard — a full-bleed maroon-gradient panel (icon chip, title,
// subtitle, stat line, optional grade badge) sitting above a plain white
// action strip with an outlined button. Use for a grid of cards that each
// lead to one detail view (a subject, a grade, a class) where the
// destination deserves more visual presence than StatPanel's neutral card.
// ---------------------------------------------------------------------------
export function HeroActionCard({
  icon: Icon,
  title,
  subtitle,
  stat,
  statIcon: StatIcon,
  stat2,
  statIcon2: StatIcon2,
  gradeLabel,
  actionLabel,
  onAction,
  panelBg,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  stat: string;
  statIcon?: LucideIcon;
  stat2?: string;
  statIcon2?: LucideIcon;
  /** Optional average-grade badge (e.g. "89%", "A") shown top-right of the hero. */
  gradeLabel?: string;
  actionLabel: string;
  onAction: () => void;
  panelBg: string;
}) {
  return (
    <div className="rounded-3xl overflow-hidden flex flex-col shadow-panel">
      {/* Gradient hero */}
      <div className="bg-maroon-gradient-vertical p-6 flex flex-col gap-6 text-white relative">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl border border-white/30 flex items-center justify-center bg-white/10">
            <Icon className="h-5.5 w-5.5 text-white" strokeWidth={2} />
          </div>
          {gradeLabel && (
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black leading-none tabular-nums">{gradeLabel}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 mt-1">
                Class Average
              </span>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-2xl font-black leading-tight tracking-tight">{title}</h3>
          <p className="text-sm font-bold mt-1 text-white/85">{subtitle}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-sm text-white/85">
            {StatIcon && <StatIcon className="h-4 w-4" strokeWidth={2.25} />}
            {stat}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-white/85">
            {StatIcon2 && <StatIcon2 className="h-4 w-4" strokeWidth={2.25} />}
            {stat2}
          </div>
        </div>
      </div>

      {/* Action strip */}
      <div className={`p-3 ${panelBg}`}>
        <button
          onClick={onAction}
          className="w-full rounded-2xl border border-maroon/25 text-maroon text-sm font-bold py-3 hover:bg-maroon/5 transition-colors"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}