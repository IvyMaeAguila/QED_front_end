import type { Teacher } from "../types/Teacher";

export const seedTeachers: Teacher[] = [
  { id: "T26-0001", firstName: "Maria", lastName: "Santos", email: "maria.santos@school.edu", contactNumber: "0917-000-0001" },
  { id: "T26-0002", firstName: "Roberto", lastName: "Cruz", email: "roberto.cruz@school.edu", contactNumber: "0917-000-0002" },
  { id: "T26-0003", firstName: "Elena", lastName: "Reyes", email: "elena.reyes@school.edu", contactNumber: "0917-000-0003" },
  { id: "T26-0004", firstName: "Paolo", lastName: "Garcia", email: "paolo.garcia@school.edu", contactNumber: "0917-000-0004" },
  { id: "T26-0005", firstName: "Christine", lastName: "Bautista", email: "christine.bautista@school.edu", contactNumber: "0917-000-0005" },
  { id: "T26-0006", firstName: "Marco", lastName: "Torres", email: "marco.torres@school.edu", contactNumber: "0917-000-0006" },
  { id: "T26-0007", firstName: "Anna", lastName: "Villanueva", email: "anna.villanueva@school.edu", contactNumber: "0917-000-0007" },
  { id: "T26-0008", firstName: "Miguel", lastName: "Ramos", email: "miguel.ramos@school.edu", contactNumber: "0917-000-0008" },
];

export function getNextTeacherId(existing: Teacher[]): string {
  const year = existing[0]?.id.slice(1, 3) ?? String(new Date().getFullYear()).slice(2);
  const maxSeq = existing.reduce((max, t) => {
    const seq = parseInt(t.id.split("-")[1] ?? "0", 10);
    return Number.isNaN(seq) ? max : Math.max(max, seq);
  }, 0);
  return `T${year}-${String(maxSeq + 1).padStart(4, "0")}`;
}