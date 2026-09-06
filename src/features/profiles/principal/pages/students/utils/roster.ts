// src/features/profiles/principal/pages/students/utils/roster.ts
import type { Student } from "../data/types";

export function fullName(s: Student): string {
  return `${s.lastName}, ${s.firstName} ${s.middleInitial}`;
}

function sortByLastName(a: Student, b: Student): number {
  return a.lastName.localeCompare(b.lastName);
}

export interface RosterByGender {
  males: Student[];
  females: Student[];
}

// Splits a roster into male/female groups, each sorted by last name —
// mirrors groupScheduleByDay in the teachers feature (utils/schedule.ts):
// a pure grouping function the component calls rather than inlining.
export function splitByGender(roster: Student[]): RosterByGender {
  return {
    males: roster.filter((s) => s.gender === "Male").sort(sortByLastName),
    females: roster.filter((s) => s.gender === "Female").sort(sortByLastName),
  };
}
