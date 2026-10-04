import { Reveal } from "./Reveal";
import universitySeal from "../../../assets/images/EUC.webp";

export const WhatIsSection = () => {
  return (
    <section id="about" className="landing-polygon-surface bg-white px-4 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="relative z-10 mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal className="relative mx-auto flex aspect-square w-full max-w-[360px] items-center justify-center rounded-3xl border border-[#E5E1DE] bg-[#F6F5F2] p-8 shadow-sm">
          <div className="absolute inset-5 rounded-2xl border border-[#800000]/15" />
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-[#E7DADB] bg-white shadow-sm sm:h-44 sm:w-44">
            <img src={universitySeal} alt="Manuel S. Enverga University Foundation seal" className="h-24 w-24 object-contain sm:h-32 sm:w-32" />
          </div>
          <span className="absolute bottom-7 left-1/2 -translate-x-1/2 rounded-full bg-[#F6F5F2] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#800000]">MSEUF-Candelaria</span>
        </Reveal>
        <Reveal delay={100}>
          <span className="text-xs font-bold uppercase tracking-[0.17em] text-[#800000]">A clearer view of school life</span>
          <h2 className="mt-4 max-w-2xl font-sans text-3xl font-bold leading-[1.12] tracking-tight text-[#211819] sm:text-4xl lg:text-5xl">
            More time for teaching. Better support for every learner.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#62595A] sm:text-base">
            QED brings student records, grades, attendance, and learning support into one place for the people who work with students every day. Staff and families can find the information they need and focus on what comes next.
          </p>
          <a href="#features" className="mt-6 inline-flex items-center gap-2 border-b border-[#800000] pb-1 text-sm font-bold text-[#800000] transition-colors hover:text-[#550000]">
            Explore the platform <span aria-hidden="true">→</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
};
