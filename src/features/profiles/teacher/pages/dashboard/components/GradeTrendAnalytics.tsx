import { useState } from "react";
import { BarChart3, ChevronDown, TrendingDown, TrendingUp } from "lucide-react";

export interface GradeTrendSubject {
  subject: string;
  points: { label: string; score: number }[];
}

interface GradeTrendAnalyticsProps {
  subjects: GradeTrendSubject[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  collapsedCount?: number;
}

const ACCENT = "#8B0D0D";
const CHART_WIDTH = 280;
const CHART_HEIGHT = 130;
const Y_MIN = 70;
const Y_MAX = 100;
const Y_TICKS = [70, 80, 90, 100];

function scoreTone(score: number) {
  if (score >= 90) return "#2F9E44";
  if (score >= 80) return "#1D70D6";
  if (score >= 75) return "#F08C00";
  return "#E03131";
}

function MiniLineChart({ points, subject }: { points: GradeTrendSubject["points"]; subject: string }) {
  if (!points.length) return <div className="flex h-40 items-center justify-center text-xs font-semibold text-slate-400">No grade data yet</div>;

  const stepX = points.length > 1 ? CHART_WIDTH / (points.length - 1) : CHART_WIDTH / 2;
  const scaleY = (score: number) => CHART_HEIGHT - ((Math.max(Y_MIN, Math.min(score, Y_MAX)) - Y_MIN) / (Y_MAX - Y_MIN)) * CHART_HEIGHT;
  const coordinates = points.map((point, index) => ({ x: points.length === 1 ? stepX : index * stepX, y: scaleY(point.score) }));
  const linePath = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${CHART_HEIGHT} L ${coordinates[0].x} ${CHART_HEIGHT} Z`;
  const last = points[points.length - 1];
  const color = scoreTone(last.score);

  return <svg viewBox={`-30 -10 ${CHART_WIDTH + 60} ${CHART_HEIGHT + 38}`} className="h-auto w-full" role="img" aria-label={`${subject} grade trend`}>
    <defs>
      <linearGradient id={`trend-fill-${subject.replace(/\s+/g, "-")}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.22" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
    </defs>
    {Y_TICKS.map((tick) => <g key={tick}><line x1={0} x2={CHART_WIDTH} y1={scaleY(tick)} y2={scaleY(tick)} stroke="currentColor" strokeOpacity="0.10" strokeDasharray="4 4" /><text x={-9} y={scaleY(tick) + 3} fontSize="9" fontWeight="700" fill="currentColor" fillOpacity="0.48" textAnchor="end">{tick}</text></g>)}
    <path d={areaPath} fill={`url(#trend-fill-${subject.replace(/\s+/g, "-")})`} />
    <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {coordinates.map((point, index) => <g key={points[index].label}><circle cx={point.x} cy={point.y} r="4.5" fill="white" stroke={color} strokeWidth="2.5" /><text x={point.x} y={CHART_HEIGHT + 19} fontSize="9" fontWeight="700" fill="currentColor" fillOpacity="0.62" textAnchor="middle">{points[index].label}</text></g>)}
  </svg>;
}

function SubjectTrend({ subject, textPrimary, textMuted, panelBorder }: { subject: GradeTrendSubject; textPrimary: string; textMuted: string; panelBorder: string }) {
  const latest = subject.points[subject.points.length - 1];
  const previous = subject.points[subject.points.length - 2];
  const change = latest && previous ? latest.score - previous.score : null;
  const color = latest ? scoreTone(latest.score) : ACCENT;

  return <article className={`rounded-2xl border p-4 sm:p-5 ${panelBorder}`}>
    <div className="flex items-start justify-between gap-3">
      <div><h3 className={`font-extrabold ${textPrimary}`}>{subject.subject}</h3><p className={`mt-1 text-[11px] font-semibold ${textMuted}`}>{subject.points.length ? `${subject.points.length} recorded period${subject.points.length === 1 ? "" : "s"}` : "Awaiting grade records"}</p></div>
      {latest && <div className="text-right"><p className="text-2xl font-black tabular-nums" style={{ color }}>{latest.score}</p><p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Latest grade</p></div>}
    </div>
    {change !== null && <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-extrabold" style={{ color: change >= 0 ? "#2F9E44" : "#E03131", backgroundColor: change >= 0 ? "#EAF8EF" : "#FDEBEC" }}>{change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{change > 0 ? "+" : ""}{change.toFixed(1)} from previous period</div>}
    <div className={`mt-4 ${textMuted}`}><MiniLineChart points={subject.points} subject={subject.subject} /></div>
  </article>;
}

export function GradeTrendAnalytics({ subjects, panelBg, panelBorder, textPrimary, textMuted, collapsedCount = 2 }: GradeTrendAnalyticsProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? subjects : subjects.slice(0, collapsedCount);
  const canExpand = subjects.length > collapsedCount;

  return <section className={`overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`}>
    <header className={`flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${panelBorder}`}>
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: ACCENT }}><BarChart3 size={18} /></span><div><h2 className={`font-extrabold ${textPrimary}`}>Grade trend analytics</h2><p className={`mt-0.5 text-xs font-medium ${textMuted}`}>Subject performance across recorded grading periods</p></div></div>
      <span className={`w-fit rounded-lg px-3 py-1.5 text-xs font-bold ${textMuted}`} style={{ backgroundColor: "#F8EDEE", color: ACCENT }}>{subjects.length} subject{subjects.length === 1 ? "" : "s"}</span>
    </header>
    {subjects.length === 0 ? <div className="px-5 py-16 text-center"><BarChart3 className="mx-auto" size={22} style={{ color: ACCENT }} /><p className={`mt-3 font-bold ${textPrimary}`}>No trend data available</p><p className={`mt-1 text-sm ${textMuted}`}>Grade charts will appear once grading periods are recorded.</p></div> : <div className="p-5"><div className="grid gap-5 lg:grid-cols-2">{visible.map((subject) => <SubjectTrend key={subject.subject} subject={subject} textPrimary={textPrimary} textMuted={textMuted} panelBorder={panelBorder} />)}</div>{canExpand && <button type="button" onClick={() => setExpanded((value) => !value)} className={`mx-auto mt-5 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${textMuted} hover:bg-black/[0.04]`}>{expanded ? "Show fewer subjects" : `View ${subjects.length - collapsedCount} more subject${subjects.length - collapsedCount === 1 ? "" : "s"}`}<ChevronDown size={14} className={expanded ? "rotate-180 transition-transform" : "transition-transform"} /></button>}</div>}
  </section>;
}
