import { ArrowRight,Menu,X } from "lucide-react";
import { useState } from "react";
import { LogoComponent } from "../../shared/components/Logo";
import { LoginPanel } from "../auth/LoginPanel";
import { FeatureSection } from "./components/FeatureSection";
import { HeroSection } from "./components/HeroSection";
import { Footer } from "./components/Footer";
import { InterventionSection } from "./components/InterventionSection";
import { Reveal } from "./components/Reveal";
import { UserRolesSection } from "./components/UserRolesSection";
import { WhatIsSection } from "./components/WhatIsSection";
import { WhyChooseSection } from "./components/WhyChooseSection";

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
        <HeroSection onLogin={() => setLoginOpen(true)} />

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
