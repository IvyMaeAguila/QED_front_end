// types/studentProfile.types.ts

export type StudentStatus = "Active" | "Inactive" | "Transferred" | "Graduated";
export type Gender = "Male" | "Female";

export interface ExtracurricularActivity {
  id: string;
  activityName: string;
  role: string; // e.g. "President", "Vice - President", "Member"
}

export interface PersonalInformation {
  fullName: string;
  studentLrn: string | null;
  gender: Gender | null;
  currentClass: string; // e.g. "Grade 1 - 1-A"
  dateOfBirth: string | null; // ISO date string, null => "Not specified"
  residentialAddress: string | null;
}

export interface StudentProfileData {
  id: string;
  lastName: string;
  firstName: string;
  middleInitial?: string;
  studentId: string | null; // e.g. "A26-0001"
  lrn: string | null; // e.g. "109162100100"
  gradeLevel: string; // e.g. "Grade 1"
  section: string; // e.g. "1-A"
  gender: Gender | null;
  status: StudentStatus | null;
  adviser?: string;
  schoolYear?: string;
  personalInformation: PersonalInformation;
  extracurricularActivities: ExtracurricularActivity[];
}