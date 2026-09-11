import { useState } from "react";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import {
  Sparkle,
  LayoutGrid,
  Menu,
  Brain,
  HeartHandshake,
  Users2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { HolisticAssessmentEntry, TermFilter } from "../types/types";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";

interface HolisticDevelopmentCardProps {
  assessment: HolisticAssessmentEntry | undefined;
  selectedTerm: TermFilter;
  theme: AdminThemeContext;
  student: DetailStudent;
}

type ViewMode = "grid" | "list";
type DomainEntry = HolisticAssessmentEntry["domains"][number];

// Per-domain color + icon, echoing the radial language of the spider chart.
const DOMAIN_META: Record<string, { color: string; icon: LucideIcon }> = {
  cognitive: { color: "#2563EB", icon: Brain },
  emotional: { color: "#7C3AED", icon: HeartHandshake },
  social: { color: "#0D9488", icon: Users2 },
  behavioral: { color: "#B45309", icon: ShieldCheck },
};
const DEFAULT_DOMAIN_META = { color: "#8B0D0D", icon: Sparkle };

function getDomainMeta(key: string) {
  return DOMAIN_META[key] ?? DEFAULT_DOMAIN_META;
}

// Score → plain-language band, same 5-point scale + palette used by
// WholeChildSnapshot's BandGauge/remark, so the two cards read as one system.
const BANDS = [
  { from: 1.0, to: 1.5, remark: "Critical", color: "#EF4444" },
  { from: 1.5, to: 2.5, remark: "Needs Improvement", color: "#FB923C" },
  { from: 2.5, to: 3.5, remark: "Average", color: "#F59E0B" },
  { from: 3.5, to: 4.5, remark: "Good", color: "#34D399" },
  { from: 4.5, to: 5.001, remark: "Excellent", color: "#22C55E" },
] as const;

function bandFor(score: number, maxScore: number) {
  const normalized = maxScore > 0 ? (score / maxScore) * 5 : 0;
  return BANDS.find((b) => normalized >= b.from && normalized < b.to) ?? BANDS[0];
}

// Custom dot so each vertex on the radar keeps its own domain color,
// matching the DomainCard swatches instead of one flat radar color.
function makeRadarDot(domains: DomainEntry[], darkMode: boolean) {
  return (props: any) => {
    const { cx, cy, index } = props;
    const domain = domains[index];
    if (!domain) return <g />;
    const color = getDomainMeta(domain.key).color;
    return (
      <circle
        key={`dot-${domain.key}`}
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        stroke={darkMode ? "#15181C" : "#FFFFFF"}
        strokeWidth={1.5}
      />
    );
  };
}

export function HolisticDevelopmentCard({
  assessment,
  selectedTerm,
  theme,
  student,
}: HolisticDevelopmentCardProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const domains = assessment?.domains ?? [];

  // "OVERALL" is only populated by the context once T1–T3 are all
  // released, so an empty `domains` here while selectedTerm is "OVERALL"
  // specifically means "still waiting on a release", not "no data".
  const isOverall = selectedTerm === "OVERALL";
  const emptyMessage = isOverall
    ? "Overall average will be available once all three terms are released."
    : "No holistic assessment data for this term.";

  // Normalize each domain onto the same 0–5 scale the radar/gauges use,
  // regardless of what maxScore the raw data came in on.
  const radarData = domains.map((d) => ({
    domain: d.label,
    score: d.maxScore ? (d.score / d.maxScore) * 5 : 0,
  }));

  const overallScore =
    domains.length > 0
      ? (
          domains.reduce((sum, d) => sum + (d.maxScore ? (d.score / d.maxScore) * 5 : 0), 0) / domains.length
        ).toFixed(1)
      : null;

  const gridStroke = darkMode ? "#FFFFFF14" : "#0000000C";
  const axisColor = darkMode ? "#9CA3AF" : "#8A8F98";

  const DomainCard = ({ d }: { d: DomainEntry }) => {
    const meta = getDomainMeta(d.key);
    const Icon = meta.icon;
    const band = bandFor(d.score, d.maxScore);

    return (
      <div className={`flex flex-col rounded-xl border p-4 ${panelBorder}`}>
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
          >
            <Icon size={14} />
          </span>
          <p className={`truncate text-[10px] font-bold uppercase tracking-wide ${textMuted}`}>{d.label}</p>
        </div>

        <p className="mt-2.5 text-base font-black leading-tight" style={{ color: band.color }}>
          {band.remark}
        </p>
        <p className={`text-[11px] font-bold ${textMuted}`}>
          {d.score.toFixed(1)} / {d.maxScore.toFixed(1)}
        </p>
      </div>
    );
  };

  return (
    <div className={`rounded-2xl border ${panelBorder} ${panelBg} px-5 pb-5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SectionHeader
            icon={Sparkle}
            title="Holistic Development Assessment"
            about={`Provides a comprehensive overview of ${student.firstName}'s holistic development across cognitive, emotional, social, and behavioral domains.`}
            theme={theme}
          />
        </div>

        {/* View toggle */}
        <div className={`flex shrink-0 items-center gap-1 rounded-lg border ${panelBorder} p-1`}>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="Grid view"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              viewMode === "grid" ? "bg-[#6D0F1F] text-white" : `${textMuted} hover:bg-black/5`
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            aria-label="List view"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              viewMode === "list" ? "bg-[#6D0F1F] text-white" : `${textMuted} hover:bg-black/5`
            }`}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className={`relative flex flex-1 flex-col items-center justify-center gap-2 rounded-xl p-4 ${
              darkMode ? "bg-white/5" : "bg-[#F6F1EF]"
            }`}
          >
            {domains.length > 0 ? (
              <div className="relative w-full max-w-[220px]">
                <div
                  className="pointer-events-none absolute inset-0 m-auto h-40 w-40 rounded-full opacity-25 blur-3xl"
                  style={{ background: "radial-gradient(circle, var(--color-gold, #D4A94A) 0%, var(--color-maroon, #8B0D0D) 55%, transparent 75%)" }}
                />
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData} outerRadius={70}>
                    <defs>
                      <radialGradient id="holisticRadarFill" cx="50%" cy="50%" r="65%">
                        <stop offset="0%" stopColor="#8B0D0D" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#8B0D0D" stopOpacity={0.14} />
                      </radialGradient>
                    </defs>
                    <PolarGrid stroke={gridStroke} strokeDasharray="3 4" />
                    <PolarAngleAxis dataKey="domain" tick={{ fill: axisColor, fontSize: 11, fontWeight: 700 }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} tickCount={6} />
                    <Radar
                      dataKey="score"
                      stroke="#8B0D0D"
                      fill="url(#holisticRadarFill)"
                      strokeWidth={2}
                      dot={makeRadarDot(domains, darkMode)}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                {overallScore && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className={`flex h-16 w-16 flex-col items-center justify-center rounded-full shadow-sm ${darkMode ? "bg-[#1A1A1A]" : "bg-white"}`}>
                      <span className={`text-lg font-black leading-none tabular-nums ${textPrimary}`}>{overallScore}</span>
                      <span className={`mt-1 text-[8px] font-bold uppercase tracking-wider ${textMuted}`}>Overall</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className={`text-center text-xs ${textMuted}`}>{emptyMessage}</p>
            )}
          </div>

          <div className="grid flex-1 grid-cols-2 gap-3">
            {domains.map((d) => (
              <DomainCard key={d.key} d={d} />
            ))}
            {domains.length === 0 && (
              <p className={`col-span-2 text-sm ${textMuted}`}>{emptyMessage}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {domains.map((d) => (
            <DomainCard key={d.key} d={d} />
          ))}
          {domains.length === 0 && (
            <p className={`col-span-full text-sm ${textMuted}`}>{emptyMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}