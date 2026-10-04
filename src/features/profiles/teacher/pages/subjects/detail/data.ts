export interface RosterStudent {
  id: string;
  name: string;
  gender: "M" | "F";
}

export function normalizeRosterGender(gender: unknown): "M" | "F" | null {
  const value = String(gender ?? "").trim().toUpperCase();
  if (value === "M" || value === "MALE") return "M";
  if (value === "F" || value === "FEMALE") return "F";
  return null;
}
