import { FeatureTag } from "./Tag";
import { Logo } from "./Logo";
import type { ComponentType } from "react";

const LogoComponent = Logo as unknown as ComponentType<{ size?: "sm" | "md" | "lg" }>;

export function HeroCard() {
  return (
    <div className="relative w-full max-w-135 mx-auto">
      {/* glow ring behind card */}
      <div className="absolute -inset-4 bg-linear-to-br from-[#bb0000]/20 to-[#C89B3C]/20 rounded-3xl blur-2xl" />

      <div className="relative bg-linear-to-b from-[#550000] to-[#bb0000] rounded-2xl p-4 shadow-2xl">
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-5">
          <LogoComponent size="lg" />
          <div className="text-center">
            <p className="text-xl font-bold text-black font-['Sora',sans-serif]">
              Welcome to QED
            </p>
            <p className="text-[#5d5d5d] text-xs mt-1">
              Your all-in-one solution for student monitoring and evaluation
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <FeatureTag label="Academic Monitoring" bgColor="bg-[#d6f8d6]" dotColor="bg-[#33db0d]" />
            <FeatureTag label="Holistic Evaluation" bgColor="bg-[#b5cffa]" dotColor="bg-[#0d66db]" />
            <FeatureTag label="Real-Time Analytics" bgColor="bg-[#e5c7ff]" dotColor="bg-[#db0dc3]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatureCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group bg-white border border-[rgba(102,102,102,0.15)] rounded-xl shadow-sm p-6 flex flex-col gap-4 hover:shadow-xl hover:-translate-y-1.5 hover:border-[#bb0000]/20 transition-all duration-300">
      <div
        className={`w-16 h-16 ${iconBg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md`}
      >
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold text-black font-['Sora',sans-serif]">{title}</p>
        <p className="text-[#5d5d5d] text-sm mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function CompactFeatureCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group bg-white border border-[rgba(102,102,102,0.12)] rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-1 hover:border-[#bb0000]/20 transition-all duration-300">
      <div
        className={`w-11 h-11 ${iconBg} rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 [&_svg]:w-5 [&_svg]:h-5`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-black font-['Sora',sans-serif] leading-snug">{title}</p>
        <p className="text-[#5d5d5d] text-xs mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function PillarCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 p-6">
      <div className="w-14 h-14 rounded-full bg-[#550000]/8 flex items-center justify-center [&_svg]:w-6 [&_svg]:h-6 [&_svg]:text-[#550000]">
        {icon}
      </div>
      <p className="text-base font-semibold text-black font-['Sora',sans-serif]">{title}</p>
      <p className="text-[#5d5d5d] text-sm leading-relaxed max-w-56">{description}</p>
    </div>
  );
}

export function RoleCard({
  icon,
  role,
  description,
}: {
  icon: React.ReactNode;
  role: string;
  description: string;
}) {
  return (
    <div className="bg-white border border-[rgba(102,102,102,0.12)] rounded-2xl p-6 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#550000] to-[#bb0000] flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5 [&_svg]:text-white">
        {icon}
      </div>
      <p className="text-base font-bold text-black font-['Sora',sans-serif]">{role}</p>
      <p className="text-[#5d5d5d] text-sm leading-relaxed">{description}</p>
    </div>
  );
}