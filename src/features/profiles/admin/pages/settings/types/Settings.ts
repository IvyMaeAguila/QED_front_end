export type Language = "English" | "Filipino";

export const LANGUAGES: Language[] = ["English", "Filipino"];

export interface SettingsState {
  darkMode: boolean;
  schoolYear: string; 
  schoolAcronym: string; 
  schoolName: string; 
  language: Language;
  emailNotifications: boolean;
  pushNotifications: boolean;
}


export function getCurrentSchoolYear(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); 
  const startYear = month >= 7 ? year : year - 1;
  return `${startYear}\u2013${startYear + 1}`;
}


export function buildSchoolYearOptions(referenceDate: Date = new Date(), span = 2): string[] {
  const current = getCurrentSchoolYear(referenceDate);
  const currentStart = Number(current.split("\u2013")[0]);
  const options: string[] = [];
  for (let offset = -span; offset <= span; offset++) {
    const start = currentStart + offset;
    options.push(`${start}\u2013${start + 1}`);
  }
  return options;
}

export function isValidSchoolYearFormat(value: string): boolean {
  return /^\d{4}\s*[\u2013-]\s*\d{4}$/.test(value.trim());
}

export function normalizeSchoolYear(value: string): string {
  const [a, b] = value.trim().split(/[\u2013-]/).map((p) => p.trim());
  return `${a}\u2013${b}`;
}