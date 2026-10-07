import { Sparkles, Brain, Heart, ListChecks, UsersRound, type LucideIcon } from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import type { HolisticDomain, HolisticDomainName, HolisticRubric } from "../data/types";

const HOLISTIC_DOMAIN_PRESENTATION: Record<HolisticDomainName, { icon: LucideIcon; color: string; tint: string }> = {
  Cognitive: { icon: Brain, color: "#4779B8", tint: "#EDF4FC" },
  Emotional: { icon: Heart, color: "#BB5660", tint: "#FCEFF0" },
  Behavioral: { icon: ListChecks, color: "#A77622", tint: "#FBF5E8" },
  Social: { icon: UsersRound, color: "#468273", tint: "#EDF7F3" },
};

function getRubricText(rubric: HolisticRubric, domain: HolisticDomainName, score: number): string {
  const level = Math.min(5, Math.max(1, Math.round(score)));
  return rubric[domain]?.[level - 1] ?? "";
}

interface HolisticDevelopmentSectionProps {
  domains: HolisticDomain[];
  rubric: HolisticRubric;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
  gridStroke: string;
  axisColor: string;
}

export function HolisticDevelopmentSection({
  domains,
  rubric,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
  gridStroke,
  axisColor,
}: HolisticDevelopmentSectionProps) {
  const overallScore = domains.length
    ? (domains.reduce((sum, d) => sum + d.score, 0) / domains.length).toFixed(1)
    : "—";

  return (
    <SectionCard title="Holistic Development Overview" icon={Sparkles} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 xl:gap-10">
        <div className="relative">
          {domains.length > 0 ? <>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={domains} outerRadius={130}>
              <defs>
                <radialGradient id="holisticFill" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="#4779B8" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#4779B8" stopOpacity={0.04} />
                </radialGradient>
              </defs>
              <PolarGrid stroke={gridStroke} strokeDasharray="3 4" />
              <PolarAngleAxis dataKey="domain" tick={{ fill: axisColor, fontSize: 12, fontWeight: 700 }} />
              <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} tickCount={6} />
              <Radar
                dataKey="score"
                stroke="#4779B8"
                fill="url(#holisticFill)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#4779B8", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`flex flex-col items-center justify-center h-20 w-20 rounded-full shadow-card ${darkMode ? "bg-[#1A1A1A]" : "bg-white"}`}>
              <span className={`text-xl font-black tabular-nums leading-none ${textPrimary}`}>{overallScore}</span>
              <span className={`mt-1 text-xs font-medium ${textMuted}`}>Overall</span>
            </div>
          </div>
          </> : (
            <div className={`flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed px-6 text-center text-sm ${panelBorder} ${textMuted}`}>
              Holistic assessment data will appear here once teachers submit ratings.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {domains.length === 0 ? (
            <p className={`rounded-xl px-4 py-3 text-sm ${darkMode ? "bg-white/[0.04]" : "bg-[#F7F7F8]"} ${textMuted}`}>
              No domain ratings are available for this term yet.
            </p>
          ) : domains.map((d) => {
            const { icon: DomainIcon, color, tint } = HOLISTIC_DOMAIN_PRESENTATION[d.domain];
            const rubricText = getRubricText(rubric, d.domain, d.score);
            return (
              <div key={d.domain} className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${panelBorder} ${darkMode ? "bg-white/[0.02]" : "bg-white"}`}>
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: darkMode ? `color-mix(in srgb, ${color} 20%, transparent)` : tint }}
                >
                  <DomainIcon className="h-[18px] w-[18px]" style={{ color }} strokeWidth={1.9} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
              <span className={`text-xs font-medium ${textMuted}`}>{d.domain}</span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums leading-none"
                      style={{ backgroundColor: darkMode ? `color-mix(in srgb, ${color} 20%, transparent)` : tint, color }}
                    >
                      {d.score.toFixed(1)}
                      <span className="opacity-60">/5</span>
                    </span>
                  </div>
                  <p className={`mt-1 text-sm font-medium leading-snug ${textPrimary}`}>{rubricText}</p>
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full" style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.055)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(d.score / 5) * 100}%`, backgroundColor: color, opacity: 0.88 }} />
                  </div>
                </div>
              </div>
            );
          })}
          <p className={`text-xs mt-1 leading-relaxed ${textMuted}`}>
            Interpretation reflects the closest matching rubric level (1–5) for each domain's average score this term, based on teacher observations schoolwide.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
