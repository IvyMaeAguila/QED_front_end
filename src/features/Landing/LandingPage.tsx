import { useState, useRef } from "react";
import { HeroCard } from "./components/Cards";
import { CircleArrowRightIcon } from "./components/LandingIcons";
import { WhatIsSection } from "./components/WhatIsSection";
import { FeatureSection } from "./components/FeatureSection";
import { InterventionSection } from "./components/InterventionSection";
import { WhyChooseSection } from "./components/WhyChooseSection";
import { UserRolesSection } from "./components/UserRolesSection";
import { ParentAcessSection } from "./components/ParentAccessSection";
import { LoginPanel } from "../auth/LoginPanel";
import { Footer } from "./components/Footer";
import { LogoComponent } from "../../shared/components/Logo";
import { Reveal } from "./components/Reveal";

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x, y });
  };

  return (
    <div
      id="home"
      className="bg-[#fafafa] min-h-screen font-['Inter',sans-serif] overflow-x-hidden"
    >
      <style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fadeGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-float { animation: floatCard 5s ease-in-out infinite; }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 6s ease infinite;
        }
        .animate-glow { animation: fadeGlow 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-float, .animate-gradient, .animate-glow { animation: none !important; }
        }
      `}</style>

      <LoginPanel open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-50 border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <LogoComponent size="sm" />
            <div>
              <p className="text-xl font-bold text-[#550000] leading-none font-['Sora',sans-serif]">
                QED
              </p>
              <p className="text-[#5d5d5d] text-[10px] font-medium tracking-widest leading-none mt-0.5">
                QUALITY EDUCATION · MSEUF-CANDELARIA
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-12">
            <nav className="hidden md:flex items-center gap-10">
              <a
                href="#home"
                className="text-[#5d5d5d] hover:text-[#550000] transition-colors text-sm font-medium"
              >
                Home
              </a>
              <a
                href="#features"
                className="text-[#5d5d5d] hover:text-[#550000] transition-colors text-sm font-medium"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-[#5d5d5d] hover:text-[#550000] transition-colors text-sm font-medium"
              >
                About
              </a>
              <a
                href="#contact"
                className="text-[#5d5d5d] hover:text-[#550000] transition-colors text-sm font-medium"
              >
                Contact
              </a>
            </nav>

            <button
              onClick={() => setLoginOpen(true)}
              className="bg-linear-to-r from-[#550000] to-[#bb0000] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#bb0000]/25 hover:-translate-y-0.5 transition-all shrink-0"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28 flex flex-col lg:flex-row items-center gap-12"
      >
        {/* ambient gradient blob */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-105 h-105 rounded-full bg-linear-to-br from-[#bb0000]/10 to-[#C89B3C]/10 blur-3xl animate-glow" />

        {/* Left */}
        <div className="flex-1 flex flex-col gap-6 relative z-10">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-[#bb0000] bg-[#bb0000]/8 px-3 py-1.5 rounded-full w-fit">
              MSEUF-CANDELARIA · ELEMENTARY DEPARTMENT
            </span>
          </Reveal>

          <Reveal delay={100}>
            <div>
              <p className="text-5xl lg:text-6xl font-extrabold text-black leading-tight font-['Sora',sans-serif] tracking-tight">
                A Smarter Way to Manage
              </p>
              <p className="text-5xl lg:text-6xl font-extrabold bg-linear-to-r from-[#550000] via-[#bb0000] to-[#550000] bg-clip-text text-transparent leading-tight font-['Sora',sans-serif] tracking-tight animate-gradient">
                Student Learning &amp; Records
              </p>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-[#5d5d5d] text-base leading-relaxed max-w-xl">
              QED provides a centralized digital platform that helps schools
              manage student records, academic performance, attendance,
              assessments, and other essential educational information in one
              accessible system.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setLoginOpen(true)}
                className="bg-linear-to-r from-[#550000] to-[#bb0000] text-white px-7 py-3.5 rounded-xl font-semibold text-base hover:shadow-xl hover:shadow-[#bb0000]/25 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                Explore QED
                <CircleArrowRightIcon color="white" />
              </button>
              <a
                href="#about"
                className="group relative overflow-hidden rounded-xl px-7 py-3.5 font-semibold text-base text-center border-2 border-[#727070cc] transition-colors duration-300 hover:border-[#b8860b]"
              >
                <span
                  className="absolute inset-0 z-0 bg-linear-to-br from-[#f2d377] via-[#e0a726] to-[#b8860b]"
                  aria-hidden="true"
                />
                <span
                  className="absolute inset-0 z-10 bg-white transition-transform duration-300 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:-translate-y-full"
                  aria-hidden="true"
                />
                <span className="relative z-20 text-[#727070cc] transition-colors duration-300 group-hover:text-white">
                  Learn More
                </span>
              </a>
            </div>
          </Reveal>
        </div>

        {/* Right: Card */}
        <div
          ref={heroRef}
          className="flex-1 w-full lg:max-w-130 relative z-10"
          style={{
            transform: `perspective(1000px) rotateY(${tilt.x * 4}deg) rotateX(${-tilt.y * 4}deg)`,
            transition: "transform 0.15s ease-out",
          }}
        >
          <div className="animate-float">
            <HeroCard />
          </div>
        </div>
      </section>

      {/* What is QED? */}
      <WhatIsSection />

      {/* Key Features */}
      <FeatureSection />

      {/* Topic-Based Intervention spotlight */}
      <InterventionSection />

      {/* Why Choose QED */}
      <WhyChooseSection />

      {/* Built for Your School (user roles) */}
      <UserRolesSection />

      {/* Parent Access Section */}
      <ParentAcessSection />

      <section className="bg-[#24143e] py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#550000]/20 via-transparent to-[#C89B3C]/10" />
        <Reveal className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-3xl lg:text-4xl font-extrabold text-white font-['Sora',sans-serif]">
            Transform the Way Your School Manages Learning
          </p>
          <p className="text-white/70 mt-4 text-base">
            Empower educators with meaningful data, simplify school processes,
            and create a more connected learning environment with QED.
          </p>
          <button
            onClick={() => setLoginOpen(true)}
            className="mt-8 bg-white text-[#550000] px-8 py-3.5 rounded-xl font-semibold text-base hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            Get Started
            <CircleArrowRightIcon color="#550000" />
          </button>
        </Reveal>
      </section>

      {/* Footer */}
      <div id="contact">
        <Footer />
      </div>
    </div>
  );
}
