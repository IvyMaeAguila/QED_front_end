export type SchoolYearStatus = "Active" | "Inactive";
export type TermStatus = "Active" | "Upcoming" | "Completed";

export interface AcademicYear {
  id: number;
  label: string; // e.g. "2026-2027"
  startDate: string | null; // derived from grading_periods, may be unset
  endDate: string | null;
  status: SchoolYearStatus;
}

export interface Term {
  id: number;
  termNumber: number;
  name: string; // e.g. "Term 1"
  startDate: string;
  endDate: string;
  status: TermStatus; // derived server-side from today vs start/end
}