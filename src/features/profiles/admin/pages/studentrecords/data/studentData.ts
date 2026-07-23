import type { Student } from "../types/Students";

export const seedStudents: Student[] = [
  { id: "A26-0001", lrn: "100000000001", lastName: "Dela Cruz", firstName: "Juan", middleName: "Manalo", gender: "Male", gradeLevel: "Grade 1", section: "A" },
  { id: "A26-0002", lrn: "100000000002", lastName: "Santos", firstName: "Maria", middleName: "Lopez", gender: "Female", gradeLevel: "Grade 1", section: "A" },
  { id: "A26-0003", lrn: "100000000003", lastName: "Reyes", firstName: "Jose", middleName: "Pineda", gender: "Male", gradeLevel: "Grade 1", section: "B" },
  { id: "A26-0004", lrn: "100000000004", lastName: "Bautista", firstName: "Angela", middleName: "Ramirez", gender: "Female", gradeLevel: "Grade 1", section: "B" },
  { id: "A26-0005", lrn: "100000000005", lastName: "Garcia", firstName: "Miguel", middleName: "Aguilar", gender: "Male", gradeLevel: "Grade 2", section: "A" },
  { id: "A26-0006", lrn: "100000000006", lastName: "Torres", firstName: "Sofia", middleName: "Domingo", gender: "Female", gradeLevel: "Grade 2", section: "A" },
  { id: "A26-0007", lrn: "100000000007", lastName: "Flores", firstName: "Gabriel", middleName: "Cabrera", gender: "Male", gradeLevel: "Grade 2", section: "B" },
  { id: "A26-0008", lrn: "100000000008", lastName: "Ramos", firstName: "Isabella", middleName: "Salonga", gender: "Female", gradeLevel: "Grade 2", section: "B" },
  { id: "A26-0009", lrn: "100000000009", lastName: "Mendoza", firstName: "Rafael", middleName: "Tolentino", gender: "Male", gradeLevel: "Grade 3", section: "A" },
  { id: "A26-0010", lrn: "100000000010", lastName: "Villanueva", firstName: "Andrea", middleName: "Guevarra", gender: "Female", gradeLevel: "Grade 3", section: "A" },
  { id: "A26-0011", lrn: "100000000011", lastName: "Castillo", firstName: "Daniel", middleName: "Ferrer", gender: "Male", gradeLevel: "Grade 3", section: "B" },
  { id: "A26-0012", lrn: "100000000012", lastName: "Aquino", firstName: "Camille", middleName: "Navarro", gender: "Female", gradeLevel: "Grade 3", section: "B" },
  { id: "A26-0013", lrn: "100000000013", lastName: "Marquez", firstName: "Nathaniel", middleName: "Villareal", gender: "Male", gradeLevel: "Grade 4", section: "A" },
  { id: "A26-0014", lrn: "100000000014", lastName: "Pascual", firstName: "Samantha", middleName: "Espino", gender: "Female", gradeLevel: "Grade 4", section: "A" },
  { id: "A26-0015", lrn: "100000000015", lastName: "Navarro", firstName: "Emmanuel", middleName: "Jimenez", gender: "Male", gradeLevel: "Grade 4", section: "B" },
  { id: "A26-0016", lrn: "100000000016", lastName: "Domingo", firstName: "Patricia", middleName: "Bautista", gender: "Female", gradeLevel: "Grade 4", section: "B" },
  { id: "A26-0017", lrn: "100000000017", lastName: "Del Rosario", firstName: "Vincent", middleName: "Hernandez", gender: "Male", gradeLevel: "Grade 5", section: "A" },
  { id: "A26-0018", lrn: "100000000018", lastName: "Salazar", firstName: "Francesca", middleName: "Ocampo", gender: "Female", gradeLevel: "Grade 5", section: "A" },
  { id: "A26-0019", lrn: "100000000019", lastName: "Cruz", firstName: "Christian", middleName: "Katigbak", gender: "Male", gradeLevel: "Grade 5", section: "B" },
  { id: "A26-0020", lrn: "100000000020", lastName: "Fernandez", firstName: "Danica", middleName: "Quijano", gender: "Female", gradeLevel: "Grade 5", section: "B" },
  { id: "A26-0021", lrn: "100000000021", lastName: "Gonzales", firstName: "Adrian", middleName: "Wenceslao", gender: "Male", gradeLevel: "Grade 6", section: "A" },
  { id: "A26-0022", lrn: "100000000022", lastName: "Morales", firstName: "Kristine", middleName: "Yatco", gender: "Female", gradeLevel: "Grade 6", section: "A" },
  { id: "A26-0023", lrn: "100000000023", lastName: "Ocampo", firstName: "Marco", middleName: "Zamora", gender: "Male", gradeLevel: "Grade 6", section: "B" },
  { id: "A26-0024", lrn: "100000000024", lastName: "Lim", firstName: "Bianca", middleName: "Ignacio", gender: "Female", gradeLevel: "Grade 6", section: "B" },
];

// export function getNextStudentId(existing: Student[]): string {
//   const year = existing[0]?.id.slice(1, 3) ?? String(new Date().getFullYear()).slice(2);
//   const maxSeq = existing.reduce((max, s) => {
//     const seq = parseInt(s.id.split("-")[1] ?? "0", 10);
//     return Number.isNaN(seq) ? max : Math.max(max, seq);
//   }, 0);
//   return `A${year}-${String(maxSeq + 1).padStart(4, "0")}`;
// }