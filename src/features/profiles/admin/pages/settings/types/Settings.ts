export type Language = "English" | "Filipino";

export const LANGUAGES: Language[] = ["English", "Filipino"];

export interface SettingsState {
  darkMode: boolean;
  schoolAcronym: string; 
  schoolName: string; 
  language: Language;
  emailNotifications: boolean;
  pushNotifications: boolean;
}