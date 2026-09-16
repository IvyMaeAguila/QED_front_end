import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Brain,
  CalendarClock,
  ClipboardList,
  Heart,
  Loader2,
  Minus,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import {
  fetchStudentHolisticProfile,
  type DomainAverages,
  type StudentHolisticProfile,
} from "./services/holistic.service";
import { fetchGradingPeriodsGlobal } from "./services/holistic.service";

// Matches --color-maroon in global.css, and the ACCENT used on the Domain
// Trends page — was a different, unrelated hex here before.
const ACCENT = "#8F1414";

type RiskLevel = "HIGH" | "MEDIUM" | "NONE";
type ChartDomainKey = keyof DomainAverages;
type ScoreBand = 1 | 2 | 3 | 4 | 5;

// Same green -> gold -> red gradient as the Domain Trends page's BANDS,
// anchored to the theme's --color-green / --color-gold / --color-red
// tokens. This page was previously using stock Tailwind palette colors
// (red-500, orange-400, amber-500, emerald-400, green-500) — a student's
// "Good" rating shouldn't render in a different color depending on which
// page you're looking at it from.
const BANDS = [
  { from: 1.0, to: 1.5, remark: "Critical", color: "#B5453F" },
  { from: 1.5, to: 2.5, remark: "Needs Improvement", color: "#D08A4F" },
  { from: 2.5, to: 3.5, remark: "Average", color: "#C9A227" },
  { from: 3.5, to: 4.5, remark: "Good", color: "#8FBF7A" },
  { from: 4.5, to: 5.001, remark: "Excellent", color: "#3F8A5F" },
] as const;

const evaluationFor = (average: number) => {
  const band = BANDS.find((b) => average >= b.from && average < b.to) ?? BANDS[BANDS.length - 1];
  return { remark: band.remark, color: band.color };
};

const DOMAIN_META: Record<ChartDomainKey, { label: string; short: string; Icon: LucideIcon }> = {
  cognitive: { label: "Cognitive", short: "Cogn", Icon: Brain },
  emotional: { label: "Emotional", short: "Emot", Icon: Heart },
  social: { label: "Social", short: "Soci", Icon: Users },
  behavioral: { label: "Behavioral", short: "Beha", Icon: Shield },
};

const DOMAIN_INTERPRETATIONS: Record<ChartDomainKey, Record<ScoreBand, string>> = {
  cognitive: {
    5: "Consistently understands and applies concepts independently",
    4: "Understands most concepts with minimal guidance",
    3: "Understands basic concepts but needs support",
    2: "Struggles to understand lessons",
    1: "Cannot demonstrate understanding",
  },
  emotional: {
    5: "Highly motivated and confident",
    4: "Generally positive and engaged",
    3: "Sometimes disengaged or unsure",
    2: "Frequently unmotivated",
    1: "Shows negative attitude toward learning",
  },
  behavioral: {
    5: "Always follows rules and stays focused",
    4: "Minor issues but generally disciplined",
    3: "Sometimes distracted",
    2: "Frequently disruptive",
    1: "Consistently problematic behavior",
  },
  social: {
    5: "Actively collaborates and leads",
    4: "Works well with peers",
    3: "Participates occasionally",
    2: "Rarely interacts",
    1: "Avoids or disrupts group work",
  },
};

const interpretationFor = (domain: ChartDomainKey, value: number): string => {
  const rounded = Math.min(5, Math.max(1, Math.round(value))) as ScoreBand;
  return DOMAIN_INTERPRETATIONS[domain][rounded];
};

// Aligned to the same three semantic tokens as BANDS above, instead of
// the separate red-500/amber-500/green-500 set this used before.
const RISK_BADGE: Record<RiskLevel, { label: string; color: string }> = {
  HIGH: { label: "High Risk", color: "#B5453F" },
  MEDIUM: { label: "Needs Attention", color: "#C9A227" },
  NONE: { label: "No Risk", color: "#3F8A5F" },
};

const TREND_META: Record<string, { label: string; color: string | null; Icon: LucideIcon }> = {
  Improving: { label: "Improving", color: "#3F8A5F", Icon: TrendingUp },
  Declining: { label: "Declining", color: "#B5453F", Icon: TrendingDown },
  Stable: { label: "Stable", color: null, Icon: Minus },
};

function BandGauge({ value, textMuted }: { value: number | null; textMuted: string }) {
  if (value === null) {
    return <div className={`mt-3 h-1.5 w-full rounded-full ${textMuted} bg-current opacity-10`} />;
  }
  const min = 1;
  const max = 5;
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const markerColor = evaluationFor(value).color;

  return (
    <div className="relative mt-4 pb-1">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full">
        {BANDS.map((b, i) => (
          <div key={i} style={{ flexGrow: b.to - b.from, backgroundColor: b.color, opacity: 0.28 }} />
        ))}
      </div>
      <div
        className="absolute top-0 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white shadow-sm dark:border-neutral-900"
        style={{ left: `${pct}%`, backgroundColor: markerColor }}
      />
    </div>
  );
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;
  const w = 92;
  const h = 26;
  const pad = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (points.length - 1);
  const coords = points
    .map((p, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (p - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const lastX = pad + (points.length - 1) * stepX;
  const lastY = pad + (1 - (points[points.length - 1] - min) / range) * (h - pad * 2);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 overflow-visible" aria-hidden="true">
      <polyline points={coords} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2.25} fill={color} />
    </svg>
  );
}

export function StudentHolisticProfilePage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [termNumber, setTermNumber] = useState<number | null>(
    searchParams.get("term") ? Number(searchParams.get("term")) : null
  );
  const [profile, setProfile] = useState<StudentHolisticProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    if (termNumber !== null) return;
    fetchGradingPeriodsGlobal()
      .then((data) => {
        const active = data.find((t) => t.isActive);
        setTermNumber(active?.termNumber ?? data[0]?.termNumber ?? 1);
      })
      .catch(() => setTermNumber(1));
  }, [termNumber]);

  useEffect(() => {
    if (!studentId || termNumber === null) return;
    setLoading(true);
    setError(null);
    fetchStudentHolisticProfile(studentId, termNumber)
      .then(setProfile)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load profile."))
      .finally(() => setLoading(false));
  }, [studentId, termNumber]);

  const activeDomainAverages = useMemo(() => {
    if (!profile) return null;
    if (activeTab === "all") {
      return {
        domainAverages: profile.overall.domainAverages,
        evaluationCount: profile.overall.evaluationCount,
        lastEvaluation: profile.overall.lastEvaluation,
        riskLevel: profile.highestRiskLevel,
      };
    }
    const subj = profile.subjects.find((s) => s.subjectSectionId === activeTab);
    return subj
      ? {
          domainAverages: subj.domainAverages,
          evaluationCount: subj.evaluationCount,
          lastEvaluation: subj.lastEvaluation,
          riskLevel: subj.riskLevel,
        }
      : null;
  }, [profile, activeTab]);

  // Now shadow-card, matching the token every other card on Domain Trends
  // uses — this was shadow-sm, a different (flatter) elevation for what
  // is visually the same kind of card.
  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const subtleFill = darkMode ? "bg-white/5" : "bg-black/[0.03]";
  const subtleHover = darkMode ? "hover:bg-white/5" : "hover:bg-black/5";

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${panelBorder} ${textMuted} ${subtleHover} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
          style={{ ["--tw-ring-color" as string]: ACCENT }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Holistic Development Profile</p>
          <h1 className={`mt-0.5 text-3xl font-black tracking-tight ${textPrimary}`}>
            {profile?.studentName ?? "Student"}
          </h1>
        </div>
      </div>

      {loading ? (
        <div className={`${cardClasses} flex flex-col items-center gap-3 px-5 py-20 text-center`}>
          <Loader2 size={22} className={`animate-spin ${textMuted}`} />
          <p className={`text-sm font-semibold ${textMuted}`}>Loading profile…</p>
        </div>
      ) : error ? (
        <div className={`${cardClasses} flex flex-col items-center gap-2 px-5 py-16 text-center`}>
          <AlertCircle size={20} style={{ color: "#B5453F" }} />
          <p className="text-sm font-semibold" style={{ color: "#B5453F" }}>{error}</p>
        </div>
      ) : !profile ? null : (
        <>
          <div className={`inline-flex max-w-full flex-wrap gap-1 rounded-2xl border p-1 ${panelBorder} ${subtleFill}`}>
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                activeTab === "all" ? "text-white shadow-sm" : `${textMuted} ${subtleHover}`
              }`}
              style={{
                ...(activeTab === "all" ? { background: ACCENT } : {}),
                ["--tw-ring-color" as string]: ACCENT,
              }}
            >
              All Subjects
            </button>
            {profile.subjects.map((subj) => (
              <button
                key={subj.subjectSectionId}
                onClick={() => setActiveTab(subj.subjectSectionId)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  activeTab === subj.subjectSectionId ? "text-white shadow-sm" : `${textMuted} ${subtleHover}`
                }`}
                style={{
                  ...(activeTab === subj.subjectSectionId ? { background: ACCENT } : {}),
                  ["--tw-ring-color" as string]: ACCENT,
                }}
              >
                {subj.subjectName}
              </button>
            ))}
          </div>

          {activeDomainAverages && (
            <section className={cardClasses}>
              <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${panelBorder}`}>
                <div>
                  <h2 className={`font-extrabold ${textPrimary}`}>
                    {activeTab === "all" ? "Whole-Child Snapshot" : profile.subjects.find((s) => s.subjectSectionId === activeTab)?.subjectName}
                  </h2>
                  {activeTab === "all" && (
                    <p className={`mt-0.5 text-[11px] font-semibold ${textMuted}`}>
                      Pooled across every subject — open a subject tab for the actionable trend.
                    </p>
                  )}
                </div>
                {activeDomainAverages.evaluationCount > 0 && (
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold"
                    style={{ backgroundColor: `${RISK_BADGE[activeDomainAverages.riskLevel].color}18`, color: RISK_BADGE[activeDomainAverages.riskLevel].color }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RISK_BADGE[activeDomainAverages.riskLevel].color }} />
                    {activeTab === "all" ? `Highest: ${RISK_BADGE[activeDomainAverages.riskLevel].label}` : RISK_BADGE[activeDomainAverages.riskLevel].label}
                  </span>
                )}
              </div>

              {activeDomainAverages.evaluationCount > 0 && (
                <div className={`flex flex-wrap items-center gap-x-6 gap-y-1.5 border-b px-5 py-3 text-xs font-semibold ${panelBorder} ${textMuted}`}>
                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardList size={13} />
                    {activeDomainAverages.evaluationCount} evaluation{activeDomainAverages.evaluationCount === 1 ? "" : "s"}
                  </span>
                  {activeDomainAverages.lastEvaluation && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock size={13} />
                      Last evaluated {activeDomainAverages.lastEvaluation}
                    </span>
                  )}
                </div>
              )}

              <div className="p-5">
                {activeDomainAverages.evaluationCount === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <ClipboardList size={20} className={textMuted} />
                    <p className={`text-sm font-semibold ${textPrimary}`}>No evaluations recorded yet.</p>
                    <p className={`max-w-xs text-xs font-medium ${textMuted}`}>
                      Weekly ratings entered for this {activeTab === "all" ? "student" : "subject"} will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {(Object.keys(DOMAIN_META) as ChartDomainKey[]).map((domain) => {
                        const { label, Icon } = DOMAIN_META[domain];
                        const value = activeDomainAverages.domainAverages[domain];
                        const domainEval = value !== null ? evaluationFor(value) : null;
                        return (
                          <div key={domain} className={`flex flex-col rounded-2xl border p-5 ${panelBorder}`}>
                            <div className="flex items-center gap-2">
                              <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                style={{
                                  backgroundColor: domainEval ? `${domainEval.color}18` : darkMode ? "#ffffff10" : "#F3F4F6",
                                  color: domainEval ? domainEval.color : undefined,
                                }}
                              >
                                <Icon size={15} />
                              </span>
                              <p className={`text-[11px] font-bold uppercase tracking-wide ${textMuted}`}>{label}</p>
                            </div>

                            <p
                              className={`mt-3 text-lg font-black leading-tight ${domainEval ? "" : textPrimary}`}
                              style={domainEval ? { color: domainEval.color } : undefined}
                            >
                              {domainEval ? domainEval.remark : "No data"}
                            </p>
                            <p className={`text-xs font-bold ${textMuted}`}>{value !== null ? `${value.toFixed(1)} / 5.0` : ""}</p>

                            <BandGauge value={value} textMuted={textMuted} />

                            {/* No decorative icon here now — matches the Domain
                                Trends page, where the same "ghost sparkle +
                                small sparkle label" treatment was removed in
                                favor of plain text. */}
                            <div
                              className={`mt-3 overflow-hidden rounded-xl border-l-[3px] px-3 py-2.5 ${subtleFill}`}
                              style={{
                                borderColor: domainEval ? domainEval.color : darkMode ? "#ffffff20" : "#E5E7EB",
                              }}
                            >
                              <span
                                className={`text-[10px] font-extrabold uppercase tracking-wider ${domainEval ? "" : textMuted}`}
                                style={{ color: domainEval ? domainEval.color : undefined }}
                              >
                                {domainEval ? "Insight" : "Pending"}
                              </span>
                              <p className={`mt-1 text-[13px] font-bold leading-snug ${textPrimary}`}>
                                {domainEval && value !== null
                                  ? interpretationFor(domain, value)
                                  : "Awaiting evaluation data."}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {activeTab !== "all" &&
                      (() => {
                        const subj = profile.subjects.find((s) => s.subjectSectionId === activeTab);
                        if (!subj || subj.recommendations.length === 0) return null;
                        return (
                          <div className={`mt-6 space-y-2 border-t pt-5 ${panelBorder}`}>
                            <p className={`text-xs font-extrabold uppercase tracking-wide ${textMuted}`}>Recommended actions</p>
                            {subj.recommendations.map((rec, i) => {
                              const color = rec.priority === "High" ? "#B5453F" : "#C9A227";
                              return (
                                <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${panelBorder}`}>
                                  <span className="mt-0.5 shrink-0" style={{ color }}>
                                    <AlertTriangle size={15} />
                                  </span>
                                  <div>
                                    <span
                                      className="mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold align-middle"
                                      style={{ backgroundColor: `${color}18`, color }}
                                    >
                                      {rec.priority} priority
                                    </span>
                                    <span className={`text-sm font-medium ${textPrimary}`}>{rec.message}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                  </>
                )}
              </div>
            </section>
          )}

          {activeTab === "all" && profile.subjects.length > 0 && (
            <section>
              <h2 className={`mb-3 text-xs font-extrabold uppercase tracking-wide ${textMuted}`}>Per-Subject Breakdown</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {profile.subjects.map((subj) => {
                  const trendMeta = TREND_META[subj.trend];
                  const points = subj.weeklyScores.map((w) => w.score);
                  return (
                    <button
                      key={subj.subjectSectionId}
                      onClick={() => setActiveTab(subj.subjectSectionId)}
                      className={`${cardClasses} text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${subtleHover}`}
                      style={{ ["--tw-ring-color" as string]: ACCENT }}
                    >
                      <div className={`flex items-center justify-between border-b px-4 py-3 ${panelBorder}`}>
                        <span className={`font-extrabold ${textPrimary}`}>{subj.subjectName}</span>
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                          style={{ backgroundColor: `${RISK_BADGE[subj.riskLevel].color}18`, color: RISK_BADGE[subj.riskLevel].color }}
                        >
                          {subj.evaluationCount === 0 ? "No data" : RISK_BADGE[subj.riskLevel].label}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 px-4 py-4">
                        {(Object.keys(DOMAIN_META) as ChartDomainKey[]).map((domain) => {
                          const { short } = DOMAIN_META[domain];
                          const value = subj.domainAverages[domain];
                          const domainEval = value !== null ? evaluationFor(value) : null;
                          return (
                            <div key={domain} className="text-center">
                              <p className={`text-[10px] font-bold ${textMuted}`}>{short}</p>
                              <p
                                className="mt-0.5 text-lg font-black"
                                style={{ color: domainEval ? domainEval.color : undefined }}
                              >
                                {value !== null ? value.toFixed(1) : "—"}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div className={`flex items-center justify-between border-t px-4 py-3 ${panelBorder}`}>
                        <span className={`text-[11px] font-semibold ${textMuted}`}>
                          {subj.evaluationCount} eval{subj.evaluationCount === 1 ? "" : "s"}
                        </span>
                        <div className="flex items-center gap-2">
                          {points.length >= 2 && (
                            <Sparkline points={points} color={trendMeta?.color ?? "#94A3B8"} />
                          )}
                          {trendMeta && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-extrabold"
                              style={{ color: trendMeta.color ?? undefined }}
                            >
                              <trendMeta.Icon size={12} className={trendMeta.color ? "" : textMuted} />
                              <span className={trendMeta.color ? "" : textMuted}>{trendMeta.label}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}