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
  { from: 4.5, to: 5.01, label: "Excellent", color: "#22C55E" },
  { from: 3.5, to: 4.5, label: "Good", color: "#34D399" },
  { from: 2.5, to: 3.5, label: "Average", color: "#F59E0B" },
  { from: 1.5, to: 2.5, label: "Needs Improvement", color: "#FB923C" },
  { from: 1.0, to: 1.5, label: "Critical", color: "#EF4444" },
];

function bandFor(value: number) {
  return BANDS.find((b) => value >= b.from && value < b.to) ?? BANDS[2];
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

// Opacity ramps with distance from the middle of the scale (3.0) so
// strong scores in either direction read as more saturated than
// borderline ones.
function opacityFor(value: number) {
  const distance = Math.abs(value - 3) / 2; 
  return 0.18 + distance * 0.62;
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

  const cellBg = darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
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
          <div className={`flex items-center px-4 py-3 text-[11px] font-bold uppercase tracking-wide border-b border-r ${hairline} ${textMuted}`}>{rowHeader}</div>
          {domainKeys.map((key) => (
            <div key={key} className={`flex items-center justify-center px-2 py-3 text-[11px] font-bold uppercase tracking-wide border-b ${hairline} ${textMuted}`}>
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
      <div className="flex flex-wrap items-center gap-4">
        {BANDS.map((band) => (
          <div key={band.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: band.color }} />
            <span className={`text-[11px] font-semibold ${textMuted}`}>{band.label}</span>
          </div>
        ))}
      </div>

      {/* Hover readout — idle and hovered states share the same
          icon-badge layout, so the panel always looks intentional rather
          than switching to plain text when nothing is hovered. */}
      <div className={`flex min-h-17 items-center gap-3.5 rounded-xl border ${panelBorder} px-5 py-3.5`}>
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
          <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#6B7280" }}>
            <MousePointerClick className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            Hover a cell to see what the score means.
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
      <div className={`flex items-center px-4 py-3 text-xs font-bold border-r ${hairline} ${textPrimary}`} style={{ backgroundColor: cellBg }}>
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
            className="relative flex items-center justify-center py-3 text-xs font-black tabular-nums transition-transform"
            style={{
              backgroundColor:
                value === null
                  ? cellBg
                  : `${bandFor(value).color}${Math.round(opacityFor(value) * 255)
                      .toString(16)
                      .padStart(2, "0")}`,
              color: "#1A1A1A",
              transform: isHovered ? "scale(1.1)" : "scale(1)",
              zIndex: isHovered ? 1 : 0,
              outline: isHovered ? "2.5px solid rgba(107,0,0,0.55)" : "none",
              outlineOffset: "-2.5px",
            }}
          >
            {value === null ? <span className={`text-[10px] font-medium ${textMuted}`}>&mdash;</span> : value.toFixed(1)}
          </button>
        );
      })}
    </>
  );
}
