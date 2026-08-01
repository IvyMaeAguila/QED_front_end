// import type { Role, UserAccount } from "../types/user";

// export const seedUsers: UserAccount[] = [
//   {
//     id: "EMP-0001",
//     lastName: "Villareal",
//     firstName: "Consolacion",
//     middleName: "T",
//     role: "ADMIN",
//     email: "c.villareal@qedschool.edu",
//     contactNumber: "0917-123-4567",
//     status: "Active",
//     lastLogin: "Jul 15, 2026 - 8:02 AM",
//   },
//   // {
//   //   id: "EMP-0002",
//   //   lastName: "Herrera",
//   //   firstName: "Bienvenido",
//   //   middleName: "S",
//   //   role: "PRINCIPAL",
//   //   email: "b.herrera@qedschool.edu",
//   //   contactNumber: "0917-234-5678",
//   //   status: "Active",
//   //   lastLogin: "Jul 14, 2026 - 7:45 AM",
//   // },
//   {
//     id: "EMP-0003",
//     lastName: "Santos",
//     firstName: "Marilou",
//     middleName: "P",
//     role: "TEACHER",
//     email: "m.santos@qedschool.edu",
//     contactNumber: "0918-345-6789",
//     status: "Active",
//     lastLogin: "Jul 15, 2026 - 7:10 AM",
//   },
//   {
//     id: "EMP-0004",
//     lastName: "Cruz",
//     firstName: "Ramon",
//     middleName: "D",
//     role: "TEACHER",
//     email: "r.cruz@qedschool.edu",
//     contactNumber: "0918-456-7890",
//     status: "Active",
//     lastLogin: "Jul 13, 2026 - 3:22 PM",
//   },
//   {
//     id: "EMP-0005",
//     lastName: "Ferrer",
//     firstName: "Loida",
//     middleName: "A",
//     role: "TEACHER",
//     email: "l.ferrer@qedschool.edu",
//     contactNumber: "0919-567-8901",
//     status: "Inactive",
//     lastLogin: "Jun 02, 2026 - 1:15 PM",
//   },
//   {
//     id: "EMP-0006",
//     lastName: "Aguilar",
//     firstName: "Noel",
//     middleName: "R",
//     role: "TEACHER",
//     email: "n.aguilar@qedschool.edu",
//     contactNumber: "0919-678-9012",
//     status: "Active",
//     lastLogin: "Jul 15, 2026 - 6:58 AM",
//   },
//   {
//     id: "PAR-0001",
//     lastName: "Dela Cruz",
//     firstName: "Roberto",
//     middleName: "M",
//     role: "PARENT",
//     email: "roberto.delacruz@gmail.com",
//     contactNumber: "0920-111-2233",
//     status: "Active",
//     lastLogin: "Jul 10, 2026 - 6:40 PM",
//   },
//   {
//     id: "PAR-0002",
//     lastName: "Santos",
//     firstName: "Liwayway",
//     middleName: "G",
//     role: "PARENT",
//     email: "liway.santos@gmail.com",
//     contactNumber: "0920-222-3344",
//     status: "Active",
//     lastLogin: "Jul 09, 2026 - 8:05 PM",
//   },
//   {
//     id: "PAR-0003",
//     lastName: "Reyes",
//     firstName: "Danilo",
//     middleName: "C",
//     role: "PARENT",
//     email: "danilo.reyes@yahoo.com",
//     contactNumber: "0921-333-4455",
//     status: "Inactive",
//     lastLogin: null,
//   },
//   {
//     id: "PAR-0004",
//     lastName: "Bautista",
//     firstName: "Fe",
//     middleName: "L",
//     role: "PARENT",
//     email: "fe.bautista@gmail.com",
//     contactNumber: "0921-444-5566",
//     status: "Active",
//     lastLogin: "Jul 08, 2026 - 5:30 PM",
//   },
// ];

// export function getNextUserId(existing: UserAccount[], role: Role): string {
//   const prefix = role === "PARENT" ? "PAR" : "EMP";
//   const maxSeq = existing
//     .filter((u) => u.id.startsWith(`${prefix}-`))
//     .reduce((max, u) => {
//       const seq = parseInt(u.id.split("-")[1] ?? "0", 10);
//       return Number.isNaN(seq) ? max : Math.max(max, seq);
//     }, 0);
//   return `${prefix}-${String(maxSeq + 1).padStart(4, "0")}`;
// }