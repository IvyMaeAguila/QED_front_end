import { Sparkles, Brain, Heart, Activity, Handshake, type LucideIcon } from "lucide-react";
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

const HOLISTIC_DOMAIN_PRESENTATION: Record<HolisticDomainName, { icon: LucideIcon; color: string }> = {
  Cognitive: { icon: Brain, color: "var(--color-maroon)" },
  Emotional: { icon: Heart, color: "var(--color-gold)" },
  Behavioral: { icon: Activity, color: "var(--color-green)" },
  Social: { icon: Handshake, color: "var(--color-bronze)" },
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
  const overallScore = (domains.reduce((sum, d) => sum + d.score, 0) / domains.length).toFixed(1);

  return (
    <SectionCard title="Holistic Development Overview" icon={Sparkles} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="relative">
          <div
            className="absolute inset-0 m-auto h-56 w-56 rounded-full blur-3xl opacity-25 pointer-events-none"
            style={{ background: "radial-gradient(circle, var(--color-gold) 0%, var(--color-maroon) 55%, transparent 75%)" }}
          />
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={domains} outerRadius={95}>
              <defs>
                <radialGradient id="holisticFill" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="var(--color-gold)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--color-maroon)" stopOpacity={0.12} />
                </radialGradient>
              </defs>
              <PolarGrid stroke={gridStroke} strokeDasharray="3 4" />
              <PolarAngleAxis dataKey="domain" tick={{ fill: axisColor, fontSize: 12, fontWeight: 700 }} />
              <PolarRadiusAxis domain={[0, 5]} tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickCount={6} />
              <Radar
                dataKey="score"
                stroke="var(--color-maroon)"
                fill="url(#holisticFill)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-maroon)", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`flex flex-col items-center justify-center h-20 w-20 rounded-full shadow-card ${darkMode ? "bg-[#1A1A1A]" : "bg-white"}`}>
              <span className={`text-xl font-black tabular-nums leading-none ${textPrimary}`}>{overallScore}</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${textMuted}`}>Overall</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {domains.map((d) => {
            const { icon: DomainIcon, color } = HOLISTIC_DOMAIN_PRESENTATION[d.domain];
            const rubricText = getRubricText(rubric, d.domain, d.score);
            return (
              <div key={d.domain} className={`flex items-start gap-4 rounded-2xl p-4 transition-transform hover:-translate-y-0.5 ${darkMode ? "glass-dark" : "glass"}`}>
                <span
                  className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
                >
                  <DomainIcon className="h-5 w-5" style={{ color }} strokeWidth={2.25} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>{d.domain}</span>
                    <span
                      className="shrink-0 text-[11px] font-black tabular-nums px-2 py-0.5 rounded-full leading-none"
                      style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
                    >
                      {d.score.toFixed(1)}
                      <span className="opacity-60">/5</span>
                    </span>
                  </div>
                  <p className={`text-sm font-bold leading-snug mt-1 ${textPrimary}`}>{rubricText}</p>
                  <div className="h-1.5 rounded-full overflow-hidden mt-2.5" style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(d.score / 5) * 100}%`, backgroundColor: color }} />
                  </div>
                </div>
              </div>
            );
          })}
          <p className={`text-[11px] mt-1 leading-relaxed ${textMuted}`}>
            Interpretation reflects the closest matching rubric level (1–5) for each domain's average score this term, based on teacher observations schoolwide.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
