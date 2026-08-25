import { useRef } from "react";
import { Reveal } from "./Reveal";
import { AlertIcon, KnowledgeIcon, DataChartsIcon } from "./LandingIcons";

const FeatureCard = ({ icon, label, desc, accent}: any) => {
  const svgRef = useRef<SVGRectElement>(null);

  const handleEnter = () => {
    const rect = svgRef.current;
    if (!rect) return;
    rect.style.animation = "none";
    void rect.getBoundingClientRect(); 
    rect.style.animation = "";
  };

  return (
    <div
      onMouseEnter={handleEnter}
      className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-1.5 hover:bg-white/8"
    >
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <rect
          ref={svgRef}
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="16"
          ry="16"
          fill="none"
          stroke="url(#goldTrace)"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="18 82"
          strokeDashoffset="100"
          className="trace-rect"
        />
        <defs>
          <linearGradient id="goldTrace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b8860b" stopOpacity="0" />
            <stop offset="50%" stopColor="#f2d377" stopOpacity="1" />
            <stop offset="100%" stopColor="#b8860b" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div
        className="w-12 h-12 rounded-xl bg-white/5 border flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
        style={{ borderColor: `${accent}33` }}
      >
        {icon}
      </div>
      <p className="text-white font-semibold text-sm font-['Sora',sans-serif] tracking-wide">
        {label}
      </p>
      <p className="text-white/55 text-xs leading-relaxed">{desc}</p>
    </div>
  );
};

export const InterventionSection = () => {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-black via-[#3a0000] to-black overflow-hidden">
      <style>{`
        /* fully hidden by default — no static dash visible before hover */
        .trace-rect {
          opacity: 0;
        }

        @keyframes traceRun {
          0%   { stroke-dashoffset: 100; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }

        .group:hover .trace-rect {
          animation: traceRun 1.3s cubic-bezier(0.4, 0, 0.2, 1) 1;
        }
      `}</style>

      {/* ambient glow */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-[#bb0000]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-10 w-96 h-96 rounded-full bg-[#e0a726]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-10 left-10 w-72 h-72 rounded-full bg-[#0f4c4c]/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/50" />

      <div className="pointer-events-none absolute -top-20 -left-20 w-125 h-125 bg-white/3 rotate-12 [clip-path:polygon(0_0,60%_0,40%_100%,0%_100%)]" />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#e0a726]/70 to-transparent" />

      <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center gap-6">
        <Reveal>
          <span className="text-xs font-semibold tracking-widest text-[#f2d377] ">
           .: THE QED DIFFERENCE :.
          </span>
        </Reveal>

        <Reveal delay={100}>
          <p className="text-4xl lg:text-5xl font-extrabold text-white font-['Sora',sans-serif] leading-tight">
            <span className="text-[#ff4d4d]">Identify.</span> Understand.{" "}
            <span className="bg-linear-to-r from-[#f2d377] via-[#e0a726] to-[#b8860b] bg-clip-text text-transparent">
              Improve.
            </span>
          </p>
        </Reveal>

        <Reveal delay={200}>
          <p className="text-xl font-semibold text-white font-['Sora',sans-serif]">
            Topic-Based Learning{" "}
            <span className="text-[#f2d377]">&amp; Intervention</span>
          </p>
        </Reveal>

        <Reveal delay={300}>
          <p className="text-white/75 text-base leading-relaxed max-w-2xl">
            QED helps teachers identify specific learning topics where
            students experience difficulties. Instead of relying solely on
            overall grades, teachers can use topic-level assessment results
            to determine which competencies require reinforcement and
            provide targeted learning interventions — aligned with the
            MATATAG Curriculum's focus on monitoring learning competencies,
            not just periodic exam scores.
          </p>
        </Reveal>

        <Reveal delay={400} className="w-full mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {[
              { icon: <AlertIcon color="#ff6b6b" />, label: "Spot the gap", desc: "Pinpoint the exact topic a learner is struggling with", accent: "#ff6b6b" },
              { icon: <KnowledgeIcon color="#f2d377" />, label: "Understand why", desc: "See topic-level results, not just a final grade", accent: "#f2d377" },
              { icon: <DataChartsIcon color="#4fd1c5" />, label: "Act on it", desc: "Give teachers a clear path to targeted intervention", accent: "#4fd1c5" },
            ].map((item) => (
              <FeatureCard key={item.label} {...item} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};