import { useState } from "react";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import { Sparkle, LayoutGrid, Menu } from "lucide-react";
import type { HolisticAssessmentEntry, Quarter } from "../types/types";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";

interface HolisticDevelopmentCardProps {
  assessment: HolisticAssessmentEntry | undefined;
  theme: AdminThemeContext;
  student: DetailStudent;
}

type ViewMode = "grid" | "list";

const AXIS_ANGLES = [-90, 0, 90, 180]; // cognitive, emotional, social, behavioral

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function HolisticDevelopmentCard({
  assessment,
  theme,
  student,
}: HolisticDevelopmentCardProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const domains = assessment?.domains ?? [];
  const cx = 100;
  const cy = 100;
  const maxR = 70;

  const outerPoints = AXIS_ANGLES.map((angle) => polarPoint(cx, cy, maxR, angle));
  const scorePoints = domains.map((d, i) =>
    polarPoint(cx, cy, maxR * (d.score / d.maxScore), AXIS_ANGLES[i])
  );

  const toPath = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

  const DomainCard = ({ d }: { d: HolisticAssessmentEntry["domains"][number] }) => (
    <div className="rounded-xl bg-[#6D0F1F] p-4 text-white">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
          {/* swap this for the actual per-domain icon if you have one */}
          <Sparkle className="h-3.5 w-3.5" />
        </span>
        <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-wide text-white/70">
          {d.label}
        </p>
      </div>
      <p className="mt-2 text-lg font-bold">
        {d.score.toFixed(1)}
        <span className="text-xs font-medium text-white/60">/{d.maxScore.toFixed(1)}</span>
      </p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-white/20">
        <div
          className="h-1.5 rounded-full bg-white"
          style={{ width: `${(d.score / d.maxScore) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-white/70">{d.subtitle}</p>
    </div>
  );

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
              viewMode === "grid"
                ? "bg-[#6D0F1F] text-white"
                : `${textMuted} hover:bg-black/5`
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
              viewMode === "list"
                ? "bg-[#6D0F1F] text-white"
                : `${textMuted} hover:bg-black/5`
            }`}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl p-4 ${
              darkMode ? "bg-white/5" : "bg-[#F6F1EF]"
            }`}
          >
            <svg
              className="h-auto w-full max-w-[220px]"
              viewBox="0 0 200 200"
              role="img"
              aria-label="Holistic development radar chart"
            >
              <polygon
                points={toPath(outerPoints)}
                fill="none"
                stroke={darkMode ? "#374151" : "#E5D5D0"}
                strokeWidth="1"
              />
              {domains.length > 0 && (
                <polygon
                  points={toPath(scorePoints)}
                  fill="#8B0D0D"
                  fillOpacity="0.25"
                  stroke="#8B0D0D"
                  strokeWidth="2"
                />
              )}
              {domains.map((d, i) => {
                const labelPoint = polarPoint(cx, cy, maxR + 22, AXIS_ANGLES[i]);
                return (
                  <text
                    key={d.key}
                    x={labelPoint.x}
                    y={labelPoint.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#8B0D0D"
                  >
                    {d.label}
                  </text>
                );
              })}
            </svg>
            {domains.length === 0 && (
              <p className={`text-center text-xs ${textMuted}`}>
                Awaiting assessment — showing baseline
              </p>
            )}
          </div>

          <div className="grid flex-1 grid-cols-2 gap-3">
            {domains.map((d) => (
              <DomainCard key={d.key} d={d} />
            ))}
            {domains.length === 0 && (
              <p className={`col-span-2 text-sm ${textMuted}`}>
                No holistic assessment data for this quarter.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {domains.map((d) => (
            <DomainCard key={d.key} d={d} />
          ))}
          {domains.length === 0 && (
            <p className={`col-span-full text-sm ${textMuted}`}>
              No holistic assessment data for this quarter.
            </p>
          )}
        </div>
      )}
    </div>
  );
}