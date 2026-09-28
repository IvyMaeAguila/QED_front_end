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
  name: string | null; 
  startDate: string | null;
  endDate: string | null;
  status: TermStatus; 
}