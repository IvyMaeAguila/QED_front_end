import { useState } from "react";
import { Brain, Heart, Activity, Users, MousePointerClick, CornerDownRight, type LucideIcon } from "lucide-react";
import type { DomainKey, HeatmapRow } from "../data/types";

// Re-exported for convenience so existing imports of `type HeatmapRow`
// from this file (as in the original standalone prototype) keep working.
export type { HeatmapRow };

// Icon/color/label per domain is presentation-only, not part of the API
// contract (DomainKey/HeatmapRow are the data shapes, defined in
// data/types.ts) — same split as HOLISTIC_DOMAIN_PRESENTATION in the
// principal dashboard's HolisticDevelopmentSection.tsx.
export const DOMAIN_META: Record<DomainKey, { label: string; short: string; icon: LucideIcon }> = {
  cognitive: { label: "Cognitive", short: "Cog", icon: Brain },
  emotional: { label: "Emotional", short: "Emo", icon: Heart },
  behavioral: { label: "Behavioral", short: "Beh", icon: Activity },
  social: { label: "Social", short: "Soc", icon: Users },
};

const BANDS = [
  { from: 4.5, to: 5.01, label: "Excellent", range: "4.5–5.0", color: "#22C55E" },
  { from: 3.5, to: 4.5, label: "Good", range: "3.5–4.4", color: "#34D399" },
  { from: 2.5, to: 3.5, label: "Average", range: "2.5–3.4", color: "#F59E0B" },
  { from: 1.5, to: 2.5, label: "Needs Improvement", range: "1.5–2.4", color: "#FB923C" },
  { from: 1.0, to: 1.5, label: "Critical", range: "1.0–1.4", color: "#EF4444" },
];

function bandFor(value: number) {
  return BANDS.find((b) => value >= b.from && value < b.to) ?? BANDS[2];
}

function opacityFor(value: number) {
  const distance = Math.abs(value - 3) / 2;
  return 0.18 + distance * 0.62;
}

const DOMAIN_INTERPRETATIONS: Record<DomainKey, Record<1 | 2 | 3 | 4 | 5, string>> = {
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

function interpretScore(domain: DomainKey, value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.min(5, Math.max(1, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
  return DOMAIN_INTERPRETATIONS[domain][rounded];
}

interface HolisticHeatmapProps {
  rows: HeatmapRow[];
  rowHeader: string; 
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function HolisticHeatmap({ rows, rowHeader, panelBorder, textPrimary, textMuted, darkMode }: HolisticHeatmapProps) {
  const [hovered, setHovered] = useState<{ row: string; domain: DomainKey } | null>(null);
  const domainKeys = Object.keys(DOMAIN_META) as DomainKey[];

  const cellBg = darkMode ? "rgba(255,255,255,0.035)" : "#FAFAFB";
  const hairline = darkMode ? "border-white/[0.08]" : "border-black/[0.06]";

  const hoveredRow = hovered ? rows.find((r) => r.label === hovered.row) : null;
  const hoveredValue = hovered && hoveredRow ? hoveredRow.scores[hovered.domain] : null;
  const hoveredInterpretation = hovered ? interpretScore(hovered.domain, hoveredValue) : null;
  const hoveredBand = hovered && hoveredValue !== null && hoveredValue !== undefined ? bandFor(hoveredValue) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Grid */}
      <div className={`overflow-hidden rounded-2xl border ${panelBorder}`}>
        <div className="grid" style={{ gridTemplateColumns: `140px repeat(${domainKeys.length}, 1fr)` }}>
          {/* header row */}
          <div className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider border-b border-r ${hairline} ${darkMode ? "bg-white/[0.04]" : "bg-[#F4F5F7]"} ${textMuted}`}>{rowHeader}</div>
          {domainKeys.map((key) => (
            <div key={key} className={`flex items-center justify-center px-2 py-3 text-xs font-bold uppercase tracking-wider border-b ${hairline} ${darkMode ? "bg-white/[0.04]" : "bg-[#F4F5F7]"} ${textMuted}`}>
              {DOMAIN_META[key].label}
            </div>
          ))}

          {/* data rows */}
          {rows.map((row) => (
            <RowCells
              key={row.label}
              row={row}
              domainKeys={domainKeys}
              hovered={hovered}
              setHovered={setHovered}
              cellBg={cellBg}
              hairline={hairline}
              textPrimary={textPrimary}
              textMuted={textMuted}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {BANDS.map((band) => (
          <div key={band.label} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-black/10" style={{ backgroundColor: band.color }} />
            <span className={`text-xs font-semibold ${textMuted}`}>{band.label}</span>
            <span className={`text-xs tabular-nums ${textMuted}`}>{band.range}</span>
          </div>
        ))}
      </div>

      <div className={`flex min-h-14 items-center gap-3 rounded-xl border ${panelBorder} px-4 py-3`}>
        {hovered ? (
          <div className="min-w-0">
            <p className={`text-sm font-bold ${textPrimary}`}>
              {hovered.row} &middot; {DOMAIN_META[hovered.domain].label}
              {hoveredValue !== null && hoveredValue !== undefined && hoveredBand && (
                <span className={`ml-2 font-medium ${textMuted}`}>
                  {hoveredValue.toFixed(1)} &middot; {hoveredBand.label}
                </span>
              )}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold" style={{ color: "#6B0000" }}>
              <CornerDownRight className="h-4 w-4 shrink-0" strokeWidth={3} />
              {hoveredInterpretation ?? "No data recorded yet for this cell."}
            </p>
          </div>
        ) : (
          <p className={`flex items-center gap-1.5 text-xs font-medium ${textMuted}`}>
            <MousePointerClick className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Hover over or focus a score to see its meaning.
          </p>
        )}
      </div>
    </div>
  );
}

function RowCells({
  row,
  domainKeys,
  hovered,
  setHovered,
  cellBg,
  hairline,
  textPrimary,
  textMuted,
}: {
  row: HeatmapRow;
  domainKeys: DomainKey[];
  hovered: { row: string; domain: DomainKey } | null;
  setHovered: (v: { row: string; domain: DomainKey } | null) => void;
  cellBg: string;
  hairline: string;
  textPrimary: string;
  textMuted: string;
}) {
  return (
    <>
      <div className={`flex items-center px-4 py-3 text-xs font-semibold border-r border-b ${hairline} ${textPrimary}`} style={{ backgroundColor: cellBg }}>
        {row.label}
      </div>
      {domainKeys.map((key) => {
        const value = row.scores[key];
        const isHovered = hovered?.row === row.label && hovered?.domain === key;
        return (
          <button
            key={key}
            type="button"
            onMouseEnter={() => setHovered({ row: row.label, domain: key })}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered({ row: row.label, domain: key })}
            onBlur={() => setHovered(null)}
            aria-label={`${row.label}, ${DOMAIN_META[key].label}: ${value === null ? "no score" : value.toFixed(1)}`}
            className={`relative flex items-center justify-center border-r border-b py-3 text-xs font-bold tabular-nums transition-[box-shadow] focus-visible:z-10 focus-visible:outline-none ${hairline}`}
            style={{
              backgroundColor: value === null
                ? cellBg
                : `${bandFor(value).color}${Math.round(opacityFor(value) * 255).toString(16).padStart(2, "0")}`,
              color: "#1A1A1A",
              boxShadow: isHovered ? "inset 0 0 0 2px #6B0000" : undefined,
            }}
          >
            {value === null ? <span className={`text-xs font-medium ${textMuted}`}>&mdash;</span> : value.toFixed(1)}
          </button>
        );
      })}
    </>
  );
}
