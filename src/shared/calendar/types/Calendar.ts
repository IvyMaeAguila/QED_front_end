export type Role = "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT";
export type CalendarReadResource='activities'|'holidays'|'all-activities'|'all-holidays';
export type CalendarReadStates=Partial<Record<CalendarReadResource,{loading:boolean;error:string|null;hasData:boolean;retry:()=>void}>>;

export const ACCENT = "var(--color-maroon)";

export interface CalendarTheme {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export type HolidayType = "regular" | "special-non-working" | "special-working";

export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  regular: "Regular Holiday",
  "special-non-working": "Special Non-working Day",
  "special-working": "Special Working Day",
};

export interface CalendarActivity {
  id: number;
  title: string;
  date: string; // ISO yyyy-mm-dd
}

export interface CalendarHoliday {
  id: number;
  title: string;
  date: string; // ISO yyyy-mm-dd
  type?: HolidayType;
}

// Ito lang ang roles na pwedeng mag-manage (magdagdag) ng activities/holidays.
export const CALENDAR_MANAGER_ROLES: Role[] = ["ADMIN", "PRINCIPAL"];
