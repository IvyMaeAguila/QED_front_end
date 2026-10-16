import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

import { LoadingRegion } from "../loading/LoadingRegion";
import { SkeletonParagraph } from "../loading/SkeletonParagraph";
import { SkeletonText } from "./SkeletonLoading";

const ACCENT = "var(--color-maroon)";

type MetricCard = {
  icon: ReactNode;
  label: string;
  value: string;
  colorClasses: string; // e.g. bg/text classes for the icon box
};

type HeroProfileBannerProps = {
  loading?: boolean;
  fieldKey?: string;
  darkMode: boolean;
  initials: string;
  title: string;           // fullName for students, or teacher name, etc.
  subtitle: string;        // "LRN: ... • ID: ..." or any identifier line
  pills: { label: string; className?: string }[];
  statusLabel?: string;    // e.g. "Active"
  metrics?: MetricCard[];  // the 3-card row at the bottom (optional)
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
};

export function HeroProfileBanner({
  darkMode,
  loading = false,
  fieldKey = "student-hero",
  initials,
  title,
  subtitle,
  pills,
  statusLabel,
  metrics,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: HeroProfileBannerProps) {
  const pillBase = "px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5";
  const fieldLabel = `text-xs font-bold uppercase tracking-wider ${textMuted}`;

  return (
    <section className={`rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder} relative`}>
      <div className="h-28 px-6 py-6 flex items-end" style={{ background: ACCENT }} />

      <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div
            className={`-mt-10 w-20 h-20 rounded-2xl shadow-md border-4 flex items-center justify-center shrink-0 z-10 ${
              darkMode ? "bg-slate-900 border-slate-900" : "bg-white border-white"
            }`}
            style={{ color: "var(--brand-ink)" }}
          >
            <span className="text-2xl font-black"><LoadingRegion as="span" name="student-hero-initials" loading={loading} skeleton={<SkeletonText width="2ch" />}>{initials || "?"}</LoadingRegion></span>
          </div>

          <div className="mt-2 sm:mt-0">
            <h1 className={`qed-type-page-title ${textPrimary}`}><LoadingRegion as="span" name="student-hero-name" variable loading={loading} skeleton={<SkeletonParagraph field={`${fieldKey}:title`} />}><span data-sk-field={`${fieldKey}:title`} className="block">{title}</span></LoadingRegion></h1>
            <p className={`qed-type-page-description mt-0.5 ${textMuted}`}><LoadingRegion as="span" name="student-hero-identifiers" variable loading={loading} skeleton={<SkeletonParagraph field={`${fieldKey}:subtitle`} width="28ch" />}><span data-sk-field={`${fieldKey}:subtitle`} className="block">{subtitle}</span></LoadingRegion></p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center mt-2 sm:mt-0" data-sk-region="studentheroprofilebanner-div-field-1">
          {pills.map((p, index) => (
            <span
              key={index}
              className={`${pillBase} ${
                p.className ??
                (darkMode
                  ? "bg-slate-800 text-slate-200 border border-slate-700"
                  : "bg-slate-100 text-slate-700 border border-slate-200")
              }`}
            >
              <LoadingRegion as="span" name={`student-hero-pill-${index}`} variable loading={loading} skeleton={<SkeletonParagraph field={`${fieldKey}:pill-${index}`} typical={index === 1 ? 1 : 2} width={index === 1 ? "6ch" : "22ch"} />}><span data-sk-field={`${fieldKey}:pill-${index}`}>{p.label}</span></LoadingRegion>
            </span>
          ))}
          {statusLabel && (
            <span
              className={`${pillBase} ${
                darkMode
                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <CheckCircle2 size={12} /> {statusLabel}
            </span>
          )}
        </div>
      </div>

      {metrics && metrics.length > 0 && (
        <div
          className={`grid sm:grid-cols-${metrics.length} divide-y sm:divide-y-0 sm:divide-x border-t ${panelBorder} ${
            darkMode ? "bg-slate-900/40" : "bg-slate-50/60"
          }`}
        >
          {metrics.map((m) => (
            <div key={m.label} className="px-6 py-4 flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.colorClasses}`}>
                {m.icon}
              </div>
              <div>
                <p className={fieldLabel}>{m.label}</p>
                <p className={`text-base font-bold mt-0.5 ${textMuted}`}>{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}