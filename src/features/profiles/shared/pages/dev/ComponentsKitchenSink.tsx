// Dev-only reference page: renders every shared DashboardUI component and
// variant in one place, plus the raw color/shadow tokens as swatches, so
// changes to global.css or DashboardUI.tsx can be visually checked at a
// glance instead of hunting through real pages. Not linked in production
// nav — wire it to a route like /dev/components (or gate it behind a
// dev-only flag) rather than exposing it to end users.

import { useState } from "react";
import {
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Trophy,
} from "lucide-react";
import {
  SectionCard,
  OverviewCard,
  StatPanel,
  TrendChip,
  ProgressBar,
  RankBadge,
  MiniStatRow,
  MiniStat,
  Dropdown,
  BackButton,
  FolderCard,
  HeroActionCard,
  type Trend,
  type CardVariant,
} from "../../components/DashboardUI";

// Local light/dark surface strings, mirroring the pattern used across the
// app's real pages (panelBg/panelBorder/textPrimary/textMuted computed
// from a darkMode boolean). This page is self-contained on purpose — it
// doesn't depend on AdminThemeContext, so it can be dropped in anywhere.
function useLocalTheme(darkMode: boolean) {
  return {
    panelBg: darkMode ? "bg-[#111827]" : "bg-white",
    panelBorder: darkMode ? "border-white/10" : "border-black/10",
    textPrimary: darkMode ? "text-white" : "text-[#111827]",
    textMuted: darkMode ? "text-white/60" : "text-black/50",
  };
}

const TREND_OPTIONS: Trend[] = ["up", "down", "flat"];

const TOKEN_SWATCHES: { label: string; varName: string }[] = [
  { label: "maroon", varName: "--color-maroon" },
  { label: "maroon-dark", varName: "--color-maroon-dark" },
  { label: "maroon-light", varName: "--color-maroon-light" },
  { label: "maroon-black", varName: "--color-maroon-black" },
  { label: "maroon-soft", varName: "--color-maroon-soft" },
  { label: "gold", varName: "--color-gold" },
  { label: "gold-dark", varName: "--color-gold-dark" },
  { label: "gold-soft", varName: "--color-gold-soft" },
  { label: "silver", varName: "--color-silver" },
  { label: "bronze", varName: "--color-bronze" },
  { label: "green", varName: "--color-green" },
  { label: "green-soft", varName: "--color-green-soft" },
  { label: "red", varName: "--color-red" },
  { label: "red-soft", varName: "--color-red-soft" },
];

function KitchenSinkSection({
  title,
  children,
  textMuted,
}: {
  title: string;
  children: React.ReactNode;
  textMuted: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className={`text-[11px] font-bold uppercase tracking-widest ${textMuted}`}>{title}</p>
      {children}
    </div>
  );
}

export function ComponentKitchenSink() {
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownValue, setDropdownValue] = useState("Term 1");
  const { panelBg, panelBorder, textPrimary, textMuted } = useLocalTheme(darkMode);

  return (
    <div
      className={`min-h-screen p-8 sm:p-12 transition-colors font-sans ${darkMode ? "bg-[#0B0F17]" : "bg-[#F3F2F2]"}`}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        {/* Page header + light/dark toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl sm:text-[32px] font-black leading-tight tracking-tight ${textPrimary}`}>
              Component Kitchen Sink
            </h1>
            <p className={`text-sm mt-2 ${textMuted}`}>
              Every shared DashboardUI component and design token, for visual QA. Dev-only — not for production nav.
            </p>
          </div>
          <button
            onClick={() => setDarkMode((v) => !v)}
            className={`h-10 px-4 rounded-2xl border text-xs font-bold uppercase tracking-wide shadow-card ${panelBg} ${panelBorder} ${textPrimary}`}
          >
            {darkMode ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>

        {/* Color tokens */}
        <KitchenSinkSection title="Color Tokens" textMuted={textMuted}>
          <div className={`rounded-2xl border p-6 shadow-card grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 ${panelBg} ${panelBorder}`}>
            {TOKEN_SWATCHES.map((t) => (
              <div key={t.varName} className="flex flex-col gap-2">
                <div
                  className="h-14 rounded-xl border"
                  style={{ backgroundColor: `var(${t.varName})`, borderColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }}
                />
                <div>
                  <p className={`text-[11px] font-bold ${textPrimary}`}>{t.label}</p>
                  <p className={`text-[10px] font-mono ${textMuted}`}>{t.varName}</p>
                </div>
              </div>
            ))}
          </div>
        </KitchenSinkSection>

        {/* Gradients */}
        <KitchenSinkSection title="Gradient Utilities" textMuted={textMuted}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl h-24 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wide bg-maroon-gradient shadow-panel">
              bg-maroon-gradient (135deg)
            </div>
            <div className="rounded-2xl h-24 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wide bg-maroon-gradient-vertical shadow-primary">
              bg-maroon-gradient-vertical (180deg)
            </div>
          </div>
        </KitchenSinkSection>

        {/* Shadows */}
        <KitchenSinkSection title="Shadow Tokens" textMuted={textMuted}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(["shadow-card", "shadow-panel", "shadow-primary"] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-3 py-4">
                <div className={`h-16 w-16 rounded-2xl ${panelBg} ${s}`} />
                <p className={`text-[11px] font-mono ${textMuted}`}>{s}</p>
              </div>
            ))}
          </div>
        </KitchenSinkSection>

        {/* Glass utilities */}
        <KitchenSinkSection title="Glass Utilities" textMuted={textMuted}>
          <div
            className="rounded-2xl p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-maroon-gradient"
          >
            <div className={`rounded-2xl p-5 ${darkMode ? "glass-dark" : "glass"}`}>
              <p className="text-xs font-bold uppercase tracking-wide text-white">
                {darkMode ? "glass-dark" : "glass"}
              </p>
              <p className="text-[11px] mt-1 text-white/80">
                Frosted panel over a colored background — used for the Subject Performance mini-cards and Holistic legend rows.
              </p>
            </div>
          </div>
        </KitchenSinkSection>

        {/* Typography scale */}
        <KitchenSinkSection title="Typography Scale" textMuted={textMuted}>
          <div className={`rounded-2xl border p-6 shadow-card flex flex-col gap-4 ${panelBg} ${panelBorder}`}>
            <p className={`text-[38px] font-black leading-none tracking-tight tabular-nums ${textPrimary}`}>
              38px / font-black / tabular-nums — headline KPI numbers
            </p>
            <p className={`text-2xl sm:text-[32px] font-black leading-tight tracking-tight ${textPrimary}`}>
              text-2xl sm:text-[32px] font-black — page/hero headings
            </p>
            <p className={`text-sm font-bold ${textPrimary}`}>text-sm font-bold — card titles, table cell emphasis</p>
            <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>
              text-xs font-bold uppercase tracking-widest — field labels
            </p>
            <p className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${textPrimary}`}>
              text-xs font-bold uppercase tracking-wide — compact section titles (SectionCard)
            </p>
          </div>
        </KitchenSinkSection>

        {/* BackButton */}
        <KitchenSinkSection title="BackButton" textMuted={textMuted}>
          <div className={`rounded-2xl border p-6 shadow-card flex items-center gap-3 ${panelBg} ${panelBorder}`}>
            <BackButton onClick={() => {}} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} />
            <p className={`text-xs ${textMuted}`}>Used on any page with a "go back" affordance.</p>
          </div>
        </KitchenSinkSection>

        {/* Dropdown */}
        <KitchenSinkSection title="Dropdown" textMuted={textMuted}>
          <div className={`rounded-2xl border p-6 shadow-card flex items-center gap-4 ${panelBg} ${panelBorder}`}>
            <Dropdown
              value={dropdownValue}
              onChange={setDropdownValue}
              options={["Term 1", "Term 2", "Term 3"]}
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
            />
            <p className={`text-xs ${textMuted}`}>
              Standard term/grade filter — often placed in a SectionCard's <code>action</code> slot. Accepts a plain
              string[] or a {"{ label, value }"}[] when display text needs to differ from the underlying value.
            </p>
          </div>
        </KitchenSinkSection>

        {/* SectionCard */}
        <KitchenSinkSection title="SectionCard" textMuted={textMuted}>
          <SectionCard title="Example Section" icon={Trophy} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
            <p className={`text-sm ${textMuted}`}>
              Any content goes here. Note the edge-to-edge divider under the title — achieved with negative margins
              matching the card's own padding.
            </p>
          </SectionCard>
        </KitchenSinkSection>

        {/* OverviewCard — all variants */}
        <KitchenSinkSection title="OverviewCard — all variants" textMuted={textMuted}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <OverviewCard
              label="Spotlight"
              value="1,280"
              sub="One per page, maroon gradient"
              icon={GraduationCap}
              variant="spotlight"
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
              darkMode={darkMode}
            />
            <OverviewCard
              label="Primary"
              value="94%"
              sub="Neutral card, solid maroon icon chip"
              icon={TrendingUp}
              trend="up"
              variant="primary"
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
              darkMode={darkMode}
            />
            <OverviewCard
              label="Gold"
              value="42"
              sub="Circular gold icon chip"
              icon={Users}
              variant="gold"
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
              darkMode={darkMode}
            />
            <OverviewCard
              label="Alert"
              value="37"
              sub="Soft red icon chip, semantic only"
              icon={AlertTriangle}
              trend="down"
              variant="alert"
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
              darkMode={darkMode}
            />
          </div>
          <p className={`text-[11px] font-mono ${textMuted}`}>
            variant: {(["spotlight", "primary", "gold", "alert"] as CardVariant[]).join(" | ")}
          </p>
        </KitchenSinkSection>

        {/* StatPanel — with and without the children slot */}
        <KitchenSinkSection title="StatPanel" textMuted={textMuted}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <StatPanel
              label="Average Grade"
              value="88.4"
              sub="Across all sections"
              icon={GraduationCap}
              variant="primary"
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
              darkMode={darkMode}
            />
            <StatPanel
              label="Attendance Rate"
              value="94%"
              sub="This term — with a children slot below"
              icon={Users}
              variant="gold"
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
              darkMode={darkMode}
            >
              <ProgressBar value={94} darkMode={darkMode} />
            </StatPanel>
          </div>
          <p className={`text-[11px] ${textMuted}`}>
            Same visual punch as OverviewCard, but with a <code>children</code> slot for supporting content
            (a progress bar, a breakdown list, an action link) underneath the number.
          </p>
        </KitchenSinkSection>

        {/* TrendChip — all states */}
        <KitchenSinkSection title="TrendChip — all states" textMuted={textMuted}>
          <div className={`rounded-2xl border p-6 shadow-card flex items-center gap-8 ${panelBg} ${panelBorder}`}>
            {TREND_OPTIONS.map((t) => (
              <div key={t} className="flex flex-col items-center gap-2">
                <TrendChip trend={t} darkMode={darkMode} />
                <p className={`text-[11px] font-mono ${textMuted}`}>{t}</p>
              </div>
            ))}
          </div>
        </KitchenSinkSection>

        {/* ProgressBar — a range of values */}
        <KitchenSinkSection title="ProgressBar" textMuted={textMuted}>
          <div className={`rounded-2xl border p-6 shadow-card flex flex-col gap-4 ${panelBg} ${panelBorder}`}>
            {[15, 45, 72, 94, 100].map((v) => (
              <div key={v} className="flex items-center gap-4">
                <div className="flex-1">
                  <ProgressBar value={v} darkMode={darkMode} />
                </div>
                <span className={`text-xs font-bold tabular-nums w-10 text-right ${textPrimary}`}>{v}%</span>
              </div>
            ))}
          </div>
        </KitchenSinkSection>

        {/* RankBadge — 1 through 5 */}
        <KitchenSinkSection title="RankBadge" textMuted={textMuted}>
          <div className={`rounded-2xl border p-6 shadow-card flex items-center gap-4 flex-wrap ${panelBg} ${panelBorder}`}>
            {[1, 2, 3, 4, 5].map((r) => (
              <RankBadge key={r} rank={r} darkMode={darkMode} />
            ))}
          </div>
        </KitchenSinkSection>

        {/* MiniStatRow / MiniStat */}
        <KitchenSinkSection title="MiniStatRow / MiniStat" textMuted={textMuted}>
          <MiniStatRow panelBg={panelBg} panelBorder={panelBorder}>
            <MiniStat label="Section" value="Section A" icon={GraduationCap} textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode} isFirst />
            <MiniStat label="Adviser" value="Ms. Reyes" icon={Users} textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode} />
            <MiniStat label="Total Students" value="8" textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode} />
          </MiniStatRow>
          <p className={`text-[11px] ${textMuted}`}>
            For short facts (2–4 values) where a full OverviewCard grid would be overkill. Icon is optional — omit it
            for plain label/value pairs.
          </p>
        </KitchenSinkSection>

        {/* FolderCard */}
        <KitchenSinkSection title="FolderCard" textMuted={textMuted}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-2xl">
            <FolderCard label="Grade 1" value="94%" valueLabel="avg" secondaryLabel="32 students" darkMode={darkMode} onClick={() => {}} />
            <FolderCard label="Grade 2" value="91%" valueLabel="avg" secondaryLabel="30 students" darkMode={darkMode} onClick={() => {}} />
            <FolderCard label="Grade 3" value="87%" valueLabel="avg" darkMode={darkMode} />
          </div>
          <p className={`text-[11px] ${textMuted}`}>
            Grid of glanceable summary tiles, each leading to a detail view (a grade, a class, a category). The
            second "card" peeking through the pocket notch is decorative — always present, not data-driven.
          </p>
        </KitchenSinkSection>

        {/* HeroActionCard */}
        <KitchenSinkSection title="HeroActionCard" textMuted={textMuted}>
          <div className="max-w-sm">
            <HeroActionCard
              icon={GraduationCap}
              title="Grade 3 — Section A"
              subtitle="Ms. Dela Cruz, Adviser"
              stat="32 students"
              statIcon={Users}
              gradeLabel="89%"
              actionLabel="View Grade Sheet"
              onAction={() => {}}
              panelBg={panelBg}
            />
          </div>
          <p className={`text-[11px] ${textMuted}`}>
            More visual presence than StatPanel — for a grid of cards where each one leads to a single detail view
            (a subject, a grade, a class) that deserves to feel like a destination.
          </p>
        </KitchenSinkSection>
      </div>
    </div>
  );
}