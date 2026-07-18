import { FeatureTag } from "./Tag";
import { Logo } from "./Logo";
import type { ComponentType } from "react";

const LogoComponent = Logo as unknown as ComponentType<{ size?: "sm" | "md" | "lg" }>;

export function HeroCard() {
return (
    <div className="relative w-full max-w-135 mx-auto">
      <div className="bg-linear-to-b from-[#550000] to-[#bb0000] rounded-2xl p-4 shadow-xl">
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-5">
          <LogoComponent size="lg" />
          <div className="text-center">
            <p className="text-xl font-bold text-black">Welcome to QED</p>
            <p className="text-[#5d5d5d] text-xs mt-1">Your all-in-one solution for student monitoring and evaluation</p>
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
    <div className="bg-[#fafafa] border border-[rgba(102,102,102,0.21)] rounded-xl shadow p-6 flex flex-col gap-4">
      <div className={`w-16 h-16 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>{icon}</div>
      <div>
        <p className="text-lg font-semibold text-black">{title}</p>
        <p className="text-[#5d5d5d] text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}