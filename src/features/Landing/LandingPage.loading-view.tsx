import { ArrowRight,ChevronRight,Menu,X } from "lucide-react";
import { useState } from "react";
import { LogoComponent } from "../../shared/components/Logo";
import { LoginPanel } from "../auth/LoginPanel";
import { FeatureSection } from "./components/FeatureSection";
import { Footer } from "./components/Footer";
import { InterventionSection } from "./components/InterventionSection";
import { Reveal } from "./components/Reveal";
import { UserRolesSection } from "./components/UserRolesSection";
import { WhatIsSection } from "./components/WhatIsSection";
import { WhyChooseSection } from "./components/WhyChooseSection";

type PreviewTab = "overview" | "academics" | "attendance";

const PREVIEW_DATA: Record<PreviewTab, { label: string; metric: string; change: string; title: string; rows: [string, string][] }> = {
  overview: { label: "Enrolled students", metric: "57", change: "Across all grade levels", title: "School overview", rows: [["Student records", "57 active"], ["Classes", "8 sections"], ["School year", "2026–2027"]] },
  academics: { label: "Subject average", metric: "82%", change: "Across all subjects", title: "Academic summary", rows: [["Subjects", "24 active"], ["Grade levels", "6 levels"], ["Term", "Term 1"]] },
  attendance: { label: "Attendance rate", metric: "94%", change: "This school year", title: "Attendance summary", rows: [["Present today", "52 students"], ["Classes", "8 sections"], ["School year", "2026–2027"]] },
};

function DashboardPreview() {
  const [tab, setTab] = useState<PreviewTab>("overview");
  const data = PREVIEW_DATA[tab];

  return (
    <div className="mx-auto w-full max-w-[610px]">
      <div className="landing-polygon-surface overflow-hidden rounded-xl border border-[#DED9D3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E4DE] px-5 py-4 sm:px-6">
          <div><p className="text-sm font-semibold text-[#241B1C]">{data.title}</p><p className="mt-1 text-xs text-[#817777]">School year 2026–2027</p></div>
          <span className="text-xs font-medium text-[#62595A]">Principal view</span>
        </div>

        <div className="flex gap-5 border-b border-[#E8E4DE] px-5 sm:px-6" role="tablist" aria-label="Dashboard preview">
          {(["overview", "academics", "attendance"] as const).map((item) => (
            <button key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`border-b-2 py-3 text-xs font-semibold capitalize transition-colors ${tab === item ? "border-maroon text-brand-ink" : "border-transparent text-[#776D6E] hover:text-[#241B1C]"}`}>
              {item}
            </button>
          ))}
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[0.8fr_1.2fr] sm:p-6">
          <div className="border-b border-[#E8E4DE] pb-5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
            <p className="text-xs text-[#776D6E]">{data.label}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-[#241B1C]">{data.metric}</p>
            <p className="mt-1 text-xs text-[#817777]">{data.change}</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-[#241B1C]">At a glance</p>
            <div className="divide-y divide-[#E8E4DE]">
              {data.rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 py-2.5 text-xs"><span className="text-[#776D6E]">{label}</span><span className="font-medium text-[#241B1C]">{value}</span></div>)}
            </div>
          </div>
        </div>
        <div className="border-t border-[#E8E4DE] px-5 py-3 text-xs text-[#817777] sm:px-6">Illustrative school data</div>
      </div>
    </div>
  );
}

function useLandingPageState() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return { content: ((
    <div id="home" data-sk-region="landing-content" className="min-h-screen overflow-x-hidden bg-[#F5F6F8] font-sans text-slate-900">
      <LoginPanel open={loginOpen} onClose={() => setLoginOpen(false)} />

      <header className="sticky top-0 z-50 border-b border-[#E2E5E9] bg-white/95 backdrop-blur-xl">
        <div className="flex h-7 items-center justify-between bg-maroon px-4 text-xs font-medium tracking-wide text-white/85 sm:px-8 lg:px-12">
          <span>MANUEL S. ENVERGA UNIVERSITY FOUNDATION · CANDELARIA</span><span className="hidden sm:inline">QUALITY EDUCATION · STUDENT SUPPORT</span>
        </div>
        <div className="mx-auto flex h-[72px] max-w-[1360px] items-center gap-5 px-4 sm:px-8 lg:px-12">
          <a href="#home" aria-label="QED home" className="flex shrink-0 items-center gap-3">
            <LogoComponent size="sm" />
            <span><span className="block font-sans text-xl font-bold leading-none text-brand-ink">QED</span><span className="mt-1 block text-xs font-semibold tracking-[0.14em] text-slate-500">QUALITY EDUCATION</span></span>
          </a>
          <nav className="ml-auto hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {[ ["Home", "#home"], ["About QED", "#about"], ["Features", "#features"], ["Intervention", "#intervention"] ].map(([label, href]) => <a key={href} href={href} className="text-xs font-semibold text-slate-700 transition-colors hover:text-maroon-light">{label}</a>)}
          </nav>
          <button onClick={() => setLoginOpen(true)} className="ml-auto rounded-lg bg-maroon px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-maroon-light md:ml-3">Login</button>
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileMenuOpen} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden">
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
        {mobileMenuOpen && <nav className="border-t border-slate-100 bg-white px-4 py-3 md:hidden" aria-label="Mobile navigation">{[["Home", "#home"], ["About QED", "#about"], ["Features", "#features"], ["Intervention", "#intervention"]].map(([label, href]) => <a key={href} href={href} onClick={closeMobileMenu} className="block px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-brand-light hover:text-maroon-light">{label}</a>)}</nav>}
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#E2E5E9] bg-[#F5F6F8]">
          <div className="mx-auto grid max-w-[1360px] items-center gap-12 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:px-12 lg:py-24">
            <div className="relative z-10">
              <Reveal>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-brand-ink sm:text-xs">
                  MSEUF-Candelaria · Elementary Department
                </span>
              </Reveal>
              <Reveal delay={100}>
                <h1 className="qed-type-display mt-5 max-w-2xl font-sans text-[#201819]">
                  Better insight. Stronger support for every student.
                </h1>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  QED helps MSEUF-Candelaria organize school records, follow student progress, and connect the people supporting each learner.
                </p>
              </Reveal>
              <Reveal delay={250}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button onClick={() => setLoginOpen(true)} className="group inline-flex min-h-[52px] min-w-[178px] items-center justify-center gap-2.5 rounded-lg bg-maroon px-6 text-sm font-semibold text-white transition-colors hover:bg-maroon-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light focus-visible:ring-offset-2">
                    Enter QED <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                  <a href="#features" className="inline-flex min-h-[52px] min-w-[178px] items-center justify-center gap-2 rounded-lg border border-[#D7DCE2] bg-white px-6 text-sm font-semibold text-[#393031] transition-colors hover:border-[#B78A8A] hover:bg-brand-soft hover:text-maroon-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light focus-visible:ring-offset-2">Explore features <ChevronRight size={16} /></a>
                </div>
              </Reveal>
              <Reveal delay={330}>
                <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-maroon" />Student-centered records</span>
                  <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-maroon" />Connected school community</span>
                </div>
              </Reveal>
            </div>
            <div className="relative z-10 lg:pl-2"><DashboardPreview /></div>
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-maroon/25" />
        </section>

        <div className="landing-polygon-surface border-b border-[#E5E1DE] bg-white">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-5 text-center text-xs font-semibold uppercase tracking-[0.13em] text-[#6C6263] sm:px-8 sm:text-xs">
            {[["01", "Student records"], ["02", "Academic progress"], ["03", "Attendance"], ["04", "Family connection"]].map(([number, label]) => <a href="#features" key={number} className="group flex items-center gap-3 px-3 py-3 sm:px-5"><span className="font-sans text-xs font-black text-brand-ink">{number}</span><span className="text-xs font-bold text-slate-600 transition-colors group-hover:text-maroon-light sm:text-sm">{label}</span><ArrowRight size={13} className="ml-auto text-slate-300 transition group-hover:translate-x-1 group-hover:text-maroon-light" /></a>)}
          </div>
        </div>

        <WhatIsSection />
        <WhyChooseSection />
        <FeatureSection />
        <InterventionSection />
        <UserRolesSection />

        <section className="relative overflow-hidden border-y border-[#E2E5E9] bg-brand-light px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Reveal className="relative mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink">Move forward, together</p>
            <h2 className="mt-4 font-sans text-3xl font-semibold tracking-tight text-[#211819] sm:text-4xl">Give every learner the support to keep moving forward.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#62595A] sm:text-base">Student information, learning progress, and family support—together in QED.</p>
            <button onClick={() => setLoginOpen(true)} className="mt-8 inline-flex min-h-12 items-center gap-2.5 rounded-lg bg-maroon px-6 text-sm font-semibold text-white transition-colors hover:bg-maroon-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light focus-visible:ring-offset-2">Login to QED <ArrowRight size={17} /></button>
          </Reveal>
        </section>
      </main>

      <div id="contact"><Footer /></div>
    </div>
  )), scope: {  } };
}


export type LandingPageEffectScope = ReturnType<typeof useLandingPageState>["scope"];
export type LandingPageRouteProps = Record<string, never>;
export function LandingPageComposition(props: object & { effects?: (scope: LandingPageEffectScope) => import("react").ReactNode }) {
 const state = useLandingPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
