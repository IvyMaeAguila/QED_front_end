import type { MonthOption } from "./../types/types";

// Hex approximations of the existing Tailwind tokens (maroon-dark, xl2,
// shadow-card, shadow-panel). Replace with your actual config tokens once
// this lives in the repo.
export const COLORS = {
  maroonDark: "#6b1220",
  maroon: "#8a1c2c",
  maroonSoft: "#fbecee",
  present: "#16a34a",
  absent: "#dc2626",
  late: "#d97706",
  ink: "#1f2937",
  sub: "#6b7280",
  line: "#e5e7eb",
  panel: "#f7f7f8",
};

export const SCHOOL_YEAR_MONTHS: MonthOption[] = [
  { key: "2026-06", label: "June 2026" },
  { key: "2026-07", label: "July 2026" },
  { key: "2026-08", label: "August 2026" },
  { key: "2026-09", label: "September 2026" },
  { key: "2026-10", label: "October 2026" },
  { key: "2026-11", label: "November 2026" },
  { key: "2026-12", label: "December 2026" },
  { key: "2027-01", label: "January 2027" },
  { key: "2027-02", label: "February 2027" },
  { key: "2027-03", label: "March 2027" },
];