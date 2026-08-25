// components/Badge.tsx
import type { ReactNode } from "react";

type BadgeVariant = "neutral" | "success" | "maroon" | "gold";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  darkMode: boolean;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, { light: string; dark: string }> = {
  neutral: {
    light: "bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]",
    dark: "bg-white/10 text-[#E5E7EB] border border-white/10",
  },
  success: {
    light: "bg-[#ECFDF3] text-[#15803D] border border-[#BBF7D0]",
    dark: "bg-[#14532D]/40 text-[#4ADE80] border border-[#166534]",
  },
  maroon: {
    light: "bg-[#FBEAEA] text-[#8B1E1E] border border-[#F3C7C7]",
    dark: "bg-[#7F1D1D]/40 text-[#FCA5A5] border border-[#7F1D1D]",
  },
  gold: {
    light: "bg-[#FDF3E3] text-[#8A5A0F] border border-[#F3DFB4]",
    dark: "bg-[#78350F]/40 text-[#FBBF24] border border-[#78350F]",
  },
};

export function Badge({ children, variant = "neutral", darkMode, icon }: BadgeProps) {
  const classes = VARIANT_CLASSES[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
        darkMode ? classes.dark : classes.light
      }`}
    >
      {icon}
      {children}
    </span>
  );
}