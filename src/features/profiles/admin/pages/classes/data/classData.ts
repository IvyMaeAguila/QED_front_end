import type { SchoolClass } from "../types/Class";

export const seedClasses: SchoolClass[] = [
  {
    id: "C26-0001",
    gradeLevel: "Grade 1",
    section: "A",
    adviserId: "T26-0001",
    schedule: [
      { id: "P0001", subject: "Math", teacherId: "T26-0001", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "07:30", endTime: "08:30" },
      { id: "P0002", subject: "English", teacherId: "T26-0002", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "08:30", endTime: "09:30" },
      { id: "P0003", subject: "Science", teacherId: "T26-0001", days: ["Mon", "Wed", "Fri"], startTime: "09:30", endTime: "10:30" },
    ],
  },
  {
    id: "C26-0002",
    gradeLevel: "Grade 1",
    section: "B",
    adviserId: "T26-0002",
    schedule: [
      { id: "P0004", subject: "Math", teacherId: "T26-0002", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "07:30", endTime: "08:30" },
      { id: "P0005", subject: "Filipino", teacherId: "T26-0003", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "08:30", endTime: "09:30" },
    ],
  },
  {
    id: "C26-0003",
    gradeLevel: "Grade 2",
    section: "A",
    adviserId: "T26-0003",
    schedule: [
      { id: "P0006", subject: "Math", teacherId: "T26-0003", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "07:30", endTime: "08:30" },
      { id: "P0007", subject: "English", teacherId: "T26-0004", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "08:30", endTime: "09:30" },
      { id: "P0008", subject: "Araling Panlipunan", teacherId: "T26-0003", days: ["Tue", "Thu"], startTime: "09:30", endTime: "10:30" },
    ],
  },
  {
    id: "C26-0004",
    gradeLevel: "Grade 2",
    section: "B",
    adviserId: "T26-0004",
    schedule: [
      { id: "P0009", subject: "Math", teacherId: "T26-0004", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "07:30", endTime: "08:30" },
      { id: "P0010", subject: "Science", teacherId: "T26-0005", days: ["Mon", "Wed", "Fri"], startTime: "08:30", endTime: "09:30" },
    ],
  },
  {
    id: "C26-0005",
    gradeLevel: "Grade 3",
    section: "A",
    adviserId: "T26-0005",
    schedule: [
      { id: "P0011", subject: "Math", teacherId: "T26-0005", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "07:30", endTime: "08:30" },
      { id: "P0012", subject: "English", teacherId: "T26-0006", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "08:30", endTime: "09:30" },
      { id: "P0013", subject: "Science", teacherId: "T26-0005", days: ["Mon", "Wed", "Fri"], startTime: "09:30", endTime: "10:30" },
    ],
  },
  {
    id: "C26-0006",
    gradeLevel: "Grade 3",
    section: "B",
    adviserId: "T26-0006",
    schedule: [
      { id: "P0014", subject: "Math", teacherId: "T26-0006", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "07:30", endTime: "08:30" },
      { id: "P0015", subject: "Filipino", teacherId: "T26-0007", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "08:30", endTime: "09:30" },
    ],
  },
  {
    id: "C26-0007",
    gradeLevel: "Grade 4",
    section: "A",
    adviserId: "T26-0007",
    schedule: [
      { id: "P0016", subject: "Math", teacherId: "T26-0007", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "07:30", endTime: "08:30" },
      { id: "P0017", subject: "English", teacherId: "T26-0008", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "08:30", endTime: "09:30" },
      { id: "P0018", subject: "Araling Panlipunan", teacherId: "T26-0007", days: ["Tue", "Thu"], startTime: "09:30", endTime: "10:30" },
    ],
  },
  {
    id: "C26-0008",
    gradeLevel: "Grade 4",
    section: "B",
    adviserId: "T26-0008",
    schedule: [
      { id: "P0019", subject: "Math", teacherId: "T26-0008", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "07:30", endTime: "08:30" },
      { id: "P0020", subject: "Science", teacherId: "T26-0001", days: ["Mon", "Wed", "Fri"], startTime: "08:30", endTime: "09:30" },
    ],
  },
  {
    id: "C26-0009",
    gradeLevel: "Grade 5",
    section: "A",
    adviserId: "T26-0001",
    schedule: [
      { id: "P0021", subject: "Math", teacherId: "T26-0001", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "07:30", endTime: "08:30" },
      { id: "P0022", subject: "English", teacherId: "T26-0002", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "08:30", endTime: "09:30" },
      { id: "P0023", subject: "Science", teacherId: "T26-0001", days: ["Mon", "Wed", "Fri"], startTime: "09:30", endTime: "10:30" },
    ],
  },
  {
    id: "C26-0010",
    gradeLevel: "Grade 5",
    section: "B",
    adviserId: "T26-0002",
    schedule: [
      { id: "P0024", subject: "Math", teacherId: "T26-0002", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "07:30", endTime: "08:30" },
      { id: "P0025", subject: "Filipino", teacherId: "T26-0003", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "08:30", endTime: "09:30" },
    ],
  },
  {
    id: "C26-0011",
    gradeLevel: "Grade 6",
    section: "A",
    adviserId: "T26-0003",
    schedule: [
      { id: "P0026", subject: "Math", teacherId: "T26-0003", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "07:30", endTime: "08:30" },
      { id: "P0027", subject: "English", teacherId: "T26-0004", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "08:30", endTime: "09:30" },
      { id: "P0028", subject: "Araling Panlipunan", teacherId: "T26-0003", days: ["Tue", "Thu"], startTime: "09:30", endTime: "10:30" },
    ],
  },
  {
    id: "C26-0012",
    gradeLevel: "Grade 6",
    section: "B",
    adviserId: "T26-0004",
    schedule: [
      { id: "P0029", subject: "Math", teacherId: "T26-0004", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "07:30", endTime: "08:30" },
      { id: "P0030", subject: "Science", teacherId: "T26-0005", days: ["Mon", "Wed", "Fri"], startTime: "08:30", endTime: "09:30" },
    ],
  },
];

export function getNextClassId(existing: SchoolClass[]): string {
  const year = existing[0]?.id.slice(1, 3) ?? String(new Date().getFullYear()).slice(2);
  const maxSeq = existing.reduce((max, c) => {
    const seq = parseInt(c.id.split("-")[1] ?? "0", 10);
    return Number.isNaN(seq) ? max : Math.max(max, seq);
  }, 0);
  return `C${year}-${String(maxSeq + 1).padStart(4, "0")}`;
}