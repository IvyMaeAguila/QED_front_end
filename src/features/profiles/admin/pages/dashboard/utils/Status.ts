import {
  TrendingUp,
  TrendingDown,
  Minus,
  Equal,
  Sparkles,
} from "lucide-react";
import type { Trend } from "../data/Dashboarddata";

export interface StatusInfo {
  label: string;
  color: string;
  bg: string;
  dot: string;
}

export function getStatus(value: number): StatusInfo {
  if (value >= 90)
    return { label: "Excellent", color: "#15803D", bg: "#DCFCE7", dot: "#22C55E" };
  if (value >= 80)
    return { label: "Good", color: "#16834A", bg: "#EAF8F0", dot: "#34D399" };
  if (value >= 70)
    return { label: "Fair", color: "#B45309", bg: "#FEF3C7", dot: "#F59E0B" };
  if (value >= 60)
    return { label: "Needs Improvement", color: "#C2410C", bg: "#FFEDD5", dot: "#FB923C" };
  return { label: "Critical", color: "#B91C1C", bg: "#FEE2E2", dot: "#EF4444" };
}

export interface TrendInfo {
  Icon: typeof TrendingUp;
  color: string;
  bg: string;
}

export const trendMap: Record<Trend, TrendInfo> = {
  Improving: { Icon: TrendingUp, color: "#16834A", bg: "#EAF8F0" },
  Consistent: { Icon: Equal, color: "#1D70D6", bg: "#EAF2FF" },
  Stable: { Icon: Minus, color: "#C98A2B", bg: "#FFF4DF" },
  Emerging: { Icon: Sparkles, color: "#7C3AED", bg: "#F3E8FF" },
  Declining: { Icon: TrendingDown, color: "#8B0D0D", bg: "#FDECEC" },
};