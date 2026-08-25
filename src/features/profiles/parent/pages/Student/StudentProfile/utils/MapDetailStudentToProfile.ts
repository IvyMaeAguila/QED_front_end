// utils/mapDetailStudentToProfile.ts
import type { DetailStudent } from "../../GlobalTypes/types";
import type { StudentProfileData } from "../types/types";

// DetailStudent (GlobalTypes/types.ts) currently only carries:
//   id, firstName, fullName, gradeLevel, section, adviser, schoolYear
//
// The Student Profile UI also wants: lastName, studentId, lrn, gender,
// status, dateOfBirth, residentialAddress, extracurricularActivities.
// None of these exist on DetailStudent yet, so they render as
// "Not specified" / are hidden until the type + backend are extended.
// Search this file for "TODO" once those fields are added.

/**
 * Best-effort last-name extraction from `fullName`, since DetailStudent
 * doesn't expose `lastName` directly.
 * Handles "Santos, Juan C." (comma format) and "Juan Santos" (space format).
 * TODO: delete this once DetailStudent has a real `lastName` field.
 */
function deriveLastName(fullName: string, firstName: string): string {
  if (fullName.includes(",")) {
    return fullName.split(",")[0].trim();
  }
  const withoutFirst = fullName.replace(firstName, "").trim();
  return withoutFirst.length > 0 ? withoutFirst : fullName;
}

export function mapDetailStudentToProfile(student: DetailStudent): StudentProfileData {
  const lastName = deriveLastName(student.fullName, student.firstName);
  const currentClass = `${student.gradeLevel} - ${student.section}`;

  return {
    id: student.id,
    firstName: student.firstName,
    lastName,
    studentId: student.id, // TODO: swap for a dedicated `studentId`/LRN-style field if `id` isn't display-safe
    lrn: null, // TODO: add `lrn` to DetailStudent
    gradeLevel: student.gradeLevel,
    section: student.section,
    gender: null, // TODO: add `gender` to DetailStudent
    status: null, // TODO: add `status` to DetailStudent
    adviser: student.adviser,
    schoolYear: student.schoolYear,
    personalInformation: {
      fullName: student.fullName,
      studentLrn: null, // TODO: add `lrn` to DetailStudent
      gender: null, // TODO: add `gender` to DetailStudent
      currentClass,
      dateOfBirth: null, // TODO: add `dateOfBirth` to DetailStudent
      residentialAddress: null, // TODO: add `residentialAddress` to DetailStudent
    },
    extracurricularActivities: [], // TODO: add `extracurricularActivities` to DetailStudent
  };
}