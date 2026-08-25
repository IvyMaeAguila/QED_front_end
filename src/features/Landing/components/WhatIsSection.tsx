import { Reveal } from "./Reveal";

export const WhatIsSection = () => {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <Reveal className="max-w-3xl mx-auto text-center flex flex-col items-center gap-5">
        <span className="text-xs font-semibold tracking-widest text-[#bb0000] bg-[#bb0000]/8 px-3 py-1.5 rounded-full w-fit">
          WHAT IS QED?
        </span>
        <p className="text-3xl lg:text-4xl font-extrabold text-black font-['Sora',sans-serif] leading-snug">
          One platform, every part of school life
        </p>
        <p className="text-[#5d5d5d] text-base leading-relaxed">
          QED is a digital educational management platform designed to
          simplify and centralize school processes. It connects
          administrators, teachers, parents, and students through organized
          access to academic and student-related information.
        </p>
      </Reveal>
    </section>
  );
};