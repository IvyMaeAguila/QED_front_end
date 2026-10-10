import { Skeleton,SkeletonAvatar,SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { lastKnownCount,rememberRows,skeletonRows } from "@shared/loading/reservations";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import {
AlertTriangle,
ArrowLeft,
Brain,
CalendarClock,
ClipboardList,
Heart,
Minus,
Shield,
TrendingDown,
TrendingUp,
Users,
type LucideIcon,
} from "lucide-react";
import { useMemo,useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useStudents } from "../../../admin/pages/studentrecords/context/StudentsContext";
import type { Student } from "../../../admin/pages/studentrecords/types/Students";
import {
fetchGradingPeriodsGlobal,
fetchStudentHolisticProfile,
type DomainAverages,
type StudentHolisticProfile,
} from "./services/holistic.service";

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
  const band =
    BANDS.find((b) => average >= b.from && average < b.to) ??
    BANDS[BANDS.length - 1];
  return { remark: band.remark, color: band.color };
};

const DOMAIN_META: Record<
  ChartDomainKey,
  { label: string; short: string; Icon: LucideIcon }
> = {
  cognitive: { label: "Cognitive", short: "Cogn", Icon: Brain },
  emotional: { label: "Emotional", short: "Emot", Icon: Heart },
  social: { label: "Social", short: "Soci", Icon: Users },
  behavioral: { label: "Behavioral", short: "Beha", Icon: Shield },
};

const DOMAIN_INTERPRETATIONS: Record<
  ChartDomainKey,
  Record<ScoreBand, string>
> = {
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

const TREND_META: Record<
  string,
  { label: string; color: string | null; Icon: LucideIcon }
> = {
  Improving: { label: "Improving", color: "#3F8A5F", Icon: TrendingUp },
  Declining: { label: "Declining", color: "#B5453F", Icon: TrendingDown },
  Stable: { label: "Stable", color: null, Icon: Minus },
};

function BandGauge({
  value,
  textMuted,
  loading = false,
}: {
  loading?: boolean;
  value: number | null;
  textMuted: string;
}) {
  if (value === null && !loading) {
    return (
      <div
        className={`mt-3 h-1.5 w-full rounded-full ${textMuted} bg-current opacity-10`}
      />
    );
  }
  const min = 1;
  const max = 5;
  const pct = Math.max(0, Math.min(100, (((value ?? 3) - min) / (max - min)) * 100));
  const markerColor = evaluationFor(value ?? 3).color;

  return (
    <div data-sk-chart="gauge" data-sk-variable="" className="relative mt-4 pb-1">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full">
        {BANDS.map((b, i) => (
          <div
            key={i}
            style={{
              flexGrow: b.to - b.from,
              backgroundColor: b.color,
              opacity: 0.28,
            }}
          />
        ))}
      </div>
      <div
        className="absolute top-0 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white shadow-sm dark:border-neutral-900"
        style={{ left: `${pct}%`, backgroundColor: loading ? "var(--sk-transparent)" : markerColor }}
      >{loading && <SkeletonAvatar className="h-full w-full" />}</div>
    </div>
  );
}

function Sparkline({ points, color, loading = false }: { points: number[]; color: string; loading?: boolean }) {
  if (points.length < 2 && !loading) return null;
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
  const lastY =
    pad + (1 - (points[points.length - 1] - min) / range) * (h - pad * 2);

  return (
    <svg
      data-sk-chart="sparkline" data-sk-variable="" width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      {loading ? <foreignObject width={w} height={h}><Skeleton className="h-full w-full rounded-none" style={{clipPath: "polygon(3% 76%, 35% 32%, 65% 55%, 97% 12%, 97% 20%, 65% 63%, 35% 40%, 3% 84%)"}} /></foreignObject> : <><polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2.25} fill={color} /></>}
    </svg>
  );
}

function useStudentHolisticProfilePageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const { studentId } = useParams<{ studentId: string }>();
  const { getStudent, loading: studentLoading, error: studentError, refetch: retryStudent } = useStudents();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [termNumber, setTermNumber] = useState<number | null>(
    searchParams.get("term") ? Number(searchParams.get("term")) : null,
  );
  const [attempt, setAttempt] = useState(0);
  const [termsAttempt, setTermsAttempt] = useState(0);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [termsLoading, setTermsLoading] = useState(!searchParams.get("term"));
  const [profile, setProfile] = useState<StudentHolisticProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const student = studentId
    ? (getStudent(studentId) as Student | undefined)
    : undefined;

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

  const combinedError = studentError || termsError || error;
  const dataLoading = !combinedError && (loading || termsLoading || (studentLoading && !student));
  const view = `holistic-profile-${studentId}-${termNumber ?? "default"}`;
  const retry = () => { if (studentError) void retryStudent(); if (termsError) setTermsAttempt(value => value + 1); if (error) setAttempt(value => value + 1); };
  const renderProfile = (pending: boolean) => {
    if (!pending && (!profile || !student)) return null;
    const data: StudentHolisticProfile = pending ? {studentId: studentId ?? "", studentName: "", isAdvisory: true, highestRiskLevel: "NONE", overall: {domainAverages: {cognitive: null, emotional: null, social: null, behavioral: null}, evaluationCount: 1, lastEvaluation: null}, subjects: Array.from({length: Math.min(lastKnownCount(view, 2), skeletonRows(view, undefined, 170))}, (_, index) => ({subjectSectionId: `pending-${index}`, subjectName: "", domainAverages: {cognitive: null, emotional: null, social: null, behavioral: null}, evaluationCount: 1, lastEvaluation: null, riskLevel: "NONE", risks: [], recommendations: [], weeksCount: 0, weeklyScores: [], pastAverage: null, recentAverage: null, currentWeekAverage: null, trend: "No Data"}))} : profile!;
    const averages = pending ? { ...data.overall, riskLevel: data.highestRiskLevel } : activeDomainAverages;
    return (<div className="space-y-6"><>
<HolisticProfileIdentity studentId={studentId ?? ""} profileName={profile?.studentName} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} />

          {averages && (
            <section className={cardClasses}>
              <div
                className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${panelBorder}`}
              >
                <div>
                  <h2 className={`text-base font-bold tracking-tight ${textPrimary}`}>
                    {activeTab === "all"
                      ? "Whole-Child Snapshot"
                      : data.subjects.find(
                          (s) => s.subjectSectionId === activeTab,
                        )?.subjectName}
                  </h2>
                  {activeTab === "all" && (
                    <p
                      className={`mt-0.5 text-xs font-semibold ${textMuted}`}
                    >
                      Pooled across every subject — open a subject tab for the
                      actionable trend.
                    </p>
                  )}
                </div>
                {/* {(pending || averages.evaluationCount > 0) && (
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${RISK_BADGE[averages.riskLevel].color} 9.41%, transparent)`,
                      color: RISK_BADGE[averages.riskLevel].color,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          RISK_BADGE[averages.riskLevel].color,
                      }}
                    />
                    {activeTab === "all"
                      ? `Highest: ${RISK_BADGE[averages.riskLevel].label}`
                      : RISK_BADGE[averages.riskLevel].label}
                  </span>
                )} */}

                <select data-sk-variable="" disabled={pending}
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  aria-label="Filter holistic profile by subject"
                  className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${panelBorder} ${textPrimary} ${panelBg}`}
                  style={{
                    ["--tw-ring-color" as string]: ACCENT,
                  }}
                >
                  <option value="all">All Subjects</option>
                  {(profile?.subjects ?? []).map((subj) => (
                    <option
                      key={subj.subjectSectionId}
                      value={subj.subjectSectionId}
                    >
                      {subj.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              {averages.evaluationCount > 0 && (
                <div
                  className={`flex flex-wrap items-center gap-x-6 gap-y-1.5 border-b px-5 py-3 text-xs font-semibold ${panelBorder} ${textMuted}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardList size={13} />
                    {pending ? <SkeletonText width="2ch" className="inline-block align-top" /> : averages.evaluationCount} evaluation
                    {averages.evaluationCount === 1 ? "" : "s"}
                  </span>
                  {(pending || averages.lastEvaluation) && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock size={13} />
                      <span data-sk-static="">Last evaluated</span> {pending ? <SkeletonText width="10ch" className="inline-block align-top" /> : averages.lastEvaluation}
                    </span>
                  )}
                </div>
              )}

              <div className="p-5">
                {!pending && averages.evaluationCount === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <ClipboardList size={20} className={textMuted} />
                    <p className={`text-sm font-semibold ${textPrimary}`}>
                      No evaluations recorded yet.
                    </p>
                    <p className={`max-w-xs text-xs font-medium ${textMuted}`}>
                      Weekly ratings entered for this{" "}
                      {activeTab === "all" ? "student" : "subject"} will appear
                      here automatically.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {(Object.keys(DOMAIN_META) as ChartDomainKey[]).map(
                        (domain) => {
                          const { label, Icon } = DOMAIN_META[domain];
                          const value =
                            averages.domainAverages[domain];
                          const domainEval =
                            value !== null ? evaluationFor(value) : null;
                          return (
                            <div
                              key={domain}
                              className={`flex flex-col rounded-2xl border p-5 ${panelBorder}`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                  style={{
                                    backgroundColor: domainEval
                                      ? `color-mix(in srgb, ${domainEval.color} 9.41%, transparent)`
                                      : darkMode
                                        ? "#ffffff10"
                                        : "var(--surface-page)",
                                    color: domainEval
                                      ? domainEval.color
                                      : undefined,
                                  }}
                                >
                                  <Icon size={15} />
                                </span>
                                <p
                                  className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}
                                >
                                  {label}
                                </p>
                              </div>

                              <p
                                className={`mt-3 text-lg font-black leading-tight ${domainEval ? "" : textPrimary}`}
                                style={
                                  domainEval
                                    ? { color: domainEval.color }
                                    : undefined
                                }
                              >
                                {pending ? <SkeletonText width={domain === "cognitive" ? "8ch" : "12ch"} /> : domainEval ? domainEval.remark : "No data"}
                              </p>
                              <p className={`text-xs font-bold ${textMuted}`}>
                                {pending ? <SkeletonText width="7ch" /> : value !== null ? `${value.toFixed(1)} / 5.0` : ""}
                              </p>

                              <BandGauge loading={pending} value={value} textMuted={textMuted} />

                              {/* No decorative icon here now — matches the Domain
                                Trends page, where the same "ghost sparkle +
                                small sparkle label" treatment was removed in
                                favor of plain text. */}
                              <div
                                className={`mt-3 overflow-hidden rounded-xl border-l-[3px] px-3 py-2.5 ${subtleFill}`}
                                style={{
                                  borderColor: domainEval
                                    ? domainEval.color
                                    : darkMode
                                      ? "#ffffff20"
                                      : "var(--border-subtle)",
                                }}
                              >
                                <span
                                  className={`text-xs font-extrabold uppercase tracking-wider ${domainEval ? "" : textMuted}`}
                                  style={{
                                    color: domainEval
                                      ? domainEval.color
                                      : undefined,
                                  }}
                                >
                                  {pending ? <SkeletonText width="7ch" className="inline-block align-top" /> : domainEval ? "Insight" : "Pending"}
                                </span>
                                <p
                                  data-sk-region={`holistic-profile-insight-${domain}`} data-sk-variable="" data-sk-field={`holistic-profile-insight-${domain}`} className={`mt-1 text-sm font-bold leading-snug ${textPrimary}`}
                                >
                                  {pending ? <SkeletonParagraph field={`holistic-profile-insight-${domain}`} typical={3} width="100%" /> : domainEval && value !== null
                                    ? interpretationFor(domain, value)
                                    : "Awaiting evaluation data."}
                                </p>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>

                    {activeTab !== "all" &&
                      (() => {
                        const subj = data.subjects.find(
                          (s) => s.subjectSectionId === activeTab,
                        );
                        if (!subj || subj.recommendations.length === 0)
                          return null;
                        return (
                          <div
                            className={`mt-6 space-y-2 border-t pt-5 ${panelBorder}`}
                          >
                            <p
                              className={`text-xs font-extrabold uppercase tracking-wide ${textMuted}`}
                            >
                              Recommended actions
                            </p>
                            {subj.recommendations.map((rec, i) => {
                              const color =
                                rec.priority === "High" ? "#B5453F" : "#C9A227";
                              return (
                                <div
                                  key={i}
                                  className={`flex items-start gap-3 rounded-xl border p-3 ${panelBorder}`}
                                >
                                  <span
                                    className="mt-0.5 shrink-0"
                                    style={{ color }}
                                  >
                                    <AlertTriangle size={15} />
                                  </span>
                                  <div>
                                    <span
                                      className="mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-extrabold align-middle"
                                      style={{
                                        backgroundColor: `color-mix(in srgb, ${color} 9.41%, transparent)`,
                                        color,
                                      }}
                                    >
                                      {rec.priority} priority
                                    </span>
                                    <span
                                      className={`text-sm font-medium ${textPrimary}`}
                                    >
                                      {rec.message}
                                    </span>
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

          {activeTab === "all" && data.subjects.length > 0 && (
            <section>
              <h2
                className={`mb-3 text-xs font-extrabold uppercase tracking-wide ${textMuted}`}
              >
                Per-Subject Breakdown
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {data.subjects.map((subj) => {
                  const trendMeta = TREND_META[subj.trend];
                  const points = subj.weeklyScores.map((w) => w.score);
                  return (
                    <button
                      data-sk-region="holistic-profile-subject" data-sk-variable="" disabled={pending} key={subj.subjectSectionId}
                      onClick={() => setActiveTab(subj.subjectSectionId)}
                      className={`${cardClasses} text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${subtleHover}`}
                      style={{ ["--tw-ring-color" as string]: ACCENT }}
                    >
                      <div
                        className={`flex items-center justify-between border-b px-4 py-3 ${panelBorder}`}
                      >
                        <span className={`font-extrabold ${textPrimary}`}>
                          {subj.subjectName}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-bold"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${RISK_BADGE[subj.riskLevel].color} 9.41%, transparent)`,
                            color: RISK_BADGE[subj.riskLevel].color,
                          }}
                        >
                          {pending ? <SkeletonText width="7ch" /> : subj.evaluationCount === 0
                            ? "No data"
                            : RISK_BADGE[subj.riskLevel].label}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 px-4 py-4">
                        {(Object.keys(DOMAIN_META) as ChartDomainKey[]).map(
                          (domain) => {
                            const { short } = DOMAIN_META[domain];
                            const value = subj.domainAverages[domain];
                            const domainEval =
                              value !== null ? evaluationFor(value) : null;
                            return (
                              <div key={domain} className="text-center">
                                <p
                                  className={`text-xs font-bold ${textMuted}`}
                                >
                                  {short}
                                </p>
                                <p
                                  className="mt-0.5 text-lg font-black"
                                  style={{
                                    color: domainEval
                                      ? domainEval.color
                                      : undefined,
                                  }}
                                >
                                  {pending ? <SkeletonText width="2.5ch" className="mx-auto" /> : value !== null ? value.toFixed(1) : "—"}
                                </p>
                              </div>
                            );
                          },
                        )}
                      </div>

                      <div
                        className={`flex items-center justify-between border-t px-4 py-3 ${panelBorder}`}
                      >
                        <span
                          className={`text-xs font-semibold ${textMuted}`}
                        >
                          {pending ? <SkeletonText width="2ch" className="inline-block align-top" /> : subj.evaluationCount} eval
                          {subj.evaluationCount === 1 ? "" : "s"}
                        </span>
                        <div className="flex items-center gap-2">
                          {(pending || points.length >= 2) && (
                            <Sparkline loading={pending}
                              points={points}
                              color={trendMeta?.color ?? "#94A3B8"}
                            />
                          )}
                          {pending ? <SkeletonText width="9ch" /> : trendMeta && (
                            <span
                              className="inline-flex items-center gap-1 text-xs font-extrabold"
                              style={{ color: trendMeta.color ?? undefined }}
                            >
                              <trendMeta.Icon
                                size={12}
                                className={trendMeta.color ? "" : textMuted}
                              />
                              <span
                                className={trendMeta.color ? "" : textMuted}
                              >
                                {trendMeta.label}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}</></div>);
  };

  return { content: ((
    <div className="space-y-6 pb-12">
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className={`system-back-button mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${panelBorder} ${textMuted} ${subtleHover} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
          style={{ ["--tw-ring-color" as string]: ACCENT }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          {/* <h1 className={`font-bold uppercase tracking-wider ${textMuted}`}>Holistic Development Profile</h1>
          <h1 className={`mt-0.5 text-3xl font-black tracking-tight ${textPrimary}`}>
            {profile?.studentName ?? "Student"}
          </h1> */}

          <h1 className={`qed-type-page-title ${textPrimary}`}>Holistic Development Profile</h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
                Current state, growth over the term, and a per-domain breakdown per subjects.
              </p>
        </div>
      </div>

      <LoadingRegion loading={dataLoading} error={combinedError} retry={retry} name="holistic-profile-data" variable skeleton={null} frame={renderProfile} onSettled={() => rememberRows(view, profile?.subjects.length ?? 0)}>{null}</LoadingRegion>

    </div>
  )), scope: { termNumber, termsAttempt, setTermsLoading, setTermsError, fetchGradingPeriodsGlobal, setTermNumber, studentId, setLoading, setError, fetchStudentHolisticProfile, setProfile, attempt } };
}

function HolisticProfileIdentity({studentId, profileName, panelBg, panelBorder, textPrimary, textMuted}: {studentId: string; profileName?: string; panelBg: string; panelBorder: string; textPrimary: string; textMuted: string}) {
  const {getStudent, loading} = useStudents();
  const student = getStudent(studentId);
  const initials = `${student?.firstName?.[0] ?? ""}${student?.lastName?.[0] ?? ""}`.toUpperCase();
  const render = (pending: boolean) => !pending && !student ? null : (          <section className={`overflow-hidden rounded-2xl border border-l-4 shadow-card ${panelBg} ${panelBorder}`} style={{ borderLeftColor: ACCENT }}>
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold shadow-sm"
                  style={{ backgroundColor: `color-mix(in srgb, ${ACCENT} 7.06%, transparent)`, color: ACCENT }}
                  data-sk-region="holistic-profile-initials" aria-hidden="true"
                >
                  {pending ? <Skeleton className="h-full w-full rounded-xl" /> : initials || "?"}
                </div>
                <div className="min-w-0">
                  <p className={`mb-1 text-xs font-bold uppercase tracking-[0.12em] ${textMuted}`}>Student profile</p>
                  <h2 className={`truncate text-lg font-bold tracking-tight sm:text-xl ${textPrimary}`}>
                    {pending ? <SkeletonText width="18ch" /> : profileName || [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "Student"}
                  </h2>
                  <p className={`mt-1 text-xs font-medium sm:text-sm ${textMuted}`}>
                    LRN: {pending ? <SkeletonText width="12ch" className="inline-block align-top" /> : student?.lrn} <span className="px-1.5 opacity-50">•</span> ID: {pending ? <SkeletonText width="8ch" className="inline-block align-top" /> : student?.studentId}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${panelBorder} ${textMuted}`}>
                  {pending ? <SkeletonText width="18ch" /> : <>{student?.gradeLevel} <span className="opacity-50">·</span> Section {student?.section}</>}
                </span>
                <span className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${panelBorder} ${textMuted}`}>
                  {pending ? <SkeletonText width="6ch" /> : student?.gender}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" /> Active
                </span>
              </div>
            </div>

            
          </section>);
  return <LoadingRegion loading={loading && !student} name="holistic-profile-identity" variable skeleton={null} frame={render}>{null}</LoadingRegion>;
}


export type StudentHolisticProfilePageEffectScope = ReturnType<typeof useStudentHolisticProfilePageState>["scope"];
export type StudentHolisticProfilePageRouteProps = Record<string, never>;
export function StudentHolisticProfilePageComposition(props: object & { effects?: (scope: StudentHolisticProfilePageEffectScope) => import("react").ReactNode }) {
 const state = useStudentHolisticProfilePageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
