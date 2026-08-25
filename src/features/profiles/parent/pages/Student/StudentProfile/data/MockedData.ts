// data/mockStudentProfile.ts
import type { StudentProfileData } from "../types/types";

export const mockStudentProfile: StudentProfileData = {
  id: "stu_0001",
  lastName: "Santos",
  firstName: "Juan",
  middleInitial: "C.",
  studentId: "A26-0001",
  lrn: "109162100100",
  gradeLevel: "Grade 1",
  section: "1-A",
  gender: "Male",
  status: "Active",
  personalInformation: {
    fullName: "Juan Santos",
    studentLrn: "109162100100",
    gender: "Male",
    currentClass: "Grade 1 - 1-A",
    dateOfBirth: null,
    residentialAddress: null,
  },
  extracurricularActivities: [
    {
      id: "act_001",
      activityName: "Supreme Student Government",
      role: "Vice - President",
    },
    {
      id: "act_002",
      activityName: "Science Club",
      role: "President",
    },
  ],
};

// Extra sample for testing empty/edge states
export const mockStudentProfileNoActivities: StudentProfileData = {
  ...mockStudentProfile,
  id: "stu_0002",
  lastName: "Dela Cruz",
  firstName: "Maria",
  middleInitial: "R.",
  studentId: "A26-0002",
  lrn: "109162100101",
  gender: "Female",
  personalInformation: {
    fullName: "Maria Dela Cruz",
    studentLrn: "109162100101",
    gender: "Female",
    currentClass: "Grade 1 - 1-A",
    dateOfBirth: "2019-05-14",
    residentialAddress: "Blk 3 Lot 12, San Pablo City, Laguna",
  },
  extracurricularActivities: [],
};