import { useState } from "react";
import { HeroCard } from "./components/Cards";
import { CircleArrowRightIcon } from "./components/LandingIcons";
import { ParentAcessSection } from "./components/ParentAccessSection";
import { LoginPanel } from "../auth/LoginPanel";
import { Footer } from "./components/Footer";
import { LogoComponent } from "../../shared/components/Logo";
import { FeatureSection } from "./components/FeatureSection";

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="bg-[#fafafa] min-h-screen font-['Inter',sans-serif]">
      <LoginPanel open={loginOpen} onClose={() => setLoginOpen(false)} />
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <LogoComponent size="sm" />
            <div>
              <p className="text-xl font-semibold text-[#550000] leading-none">
                QED
              </p>
              <p className="text-[#5d5d5d] text-[10px] font-normal leading-none mt-0.5">
                QUALITY EDUCATION
              </p>
            </div>
          </div>

          {/* Right Side */}
          <div className="ml-auto flex items-center gap-12">
            <nav className="hidden md:flex items-center gap-12">
              <a
                href="#features"
                className="text-[#5d5d5d] hover:text-black transition-colors text-sm"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-[#5d5d5d] hover:text-black transition-colors text-sm"
              >
                About Us
              </a>
            </nav>

            <button
              onClick={() => setLoginOpen(true)}
              className="bg-linear-to-r from-[#550000] to-[#bb0000] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">
        {/* Left */}
        <div className="flex-1 flex flex-col gap-6">
          <div>
            <p className="text-5xl lg:text-6xl font-semibold text-black leading-tight">
              Elevate Your
            </p>
            <p className="text-5xl lg:text-6xl font-semibold bg-linear-to-r from-[#550000] to-[#bb0000] bg-clip-text text-transparent leading-tight">
              Teaching Excellence
            </p>
          </div>
          <p className="text-[#5d5d5d] text-base leading-relaxed max-w-xl">
            A comprehensive platform designed for teachers to manage subjects,
            monitor student performance, and streamline grading with intelligent
            automation.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-linear-to-r from-[#550000] to-[#bb0000] text-white px-7 py-3.5 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity flex items-center gap-2">
              Get started
              <CircleArrowRightIcon color="white" />
            </button>
            <button className="bg-[#fafafa] border border-[#5d5d5d] text-[#5d5d5d] px-7 py-3.5 rounded-xl font-semibold text-base hover:bg-gray-100 transition-colors">
              Learn more
            </button>
          </div>
        </div>

        {/* Right: Card */}
        <div className="flex-1 w-full lg:max-w-130">
          <HeroCard />
        </div>
      </section>

      {/* Features Section */}
      <FeatureSection />

      {/* Parent Access Section */}
      <ParentAcessSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}