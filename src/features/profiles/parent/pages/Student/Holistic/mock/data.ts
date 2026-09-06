// import type { WholeChildSnapshotData, HistoryEntry } from "../types/types";
// import type { DomainSummary } from "../types/types";

// /** Matches the screenshot: all-excellent, no risk. */
// export const mockSnapshotExcellent: WholeChildSnapshotData = {
//   domainAverages: {
//     cognitive: 4.5,
//     emotional: 5.0,
//     social: 4.8,
//     behavioral: 5.0,
//   },
//   evaluationCount: 26,
//   lastEvaluation: "2026-08-24",
//   riskLevel: "NONE",
// };

// /** Sample past periods showing improvement leading up to mockSnapshotExcellent. */
// export const mockSnapshotHistory: HistoryEntry[] = [
//   {
//     label: "Week of Aug 17",
//     date: "2026-08-17",
//     domainAverages: { cognitive: 4.2, emotional: 4.6, social: 4.5, behavioral: 4.8 },
//   },
//   {
//     label: "Week of Aug 10",
//     date: "2026-08-10",
//     domainAverages: { cognitive: 3.9, emotional: 4.3, social: 4.1, behavioral: 4.4 },
//   },
//   {
//     label: "Week of Aug 3",
//     date: "2026-08-03",
//     domainAverages: { cognitive: 3.6, emotional: 3.8, social: 3.9, behavioral: 4.0 },
//   },
// ];

// /** A student who needs attention, for testing the warning states. */
// export const mockSnapshotAtRisk: WholeChildSnapshotData = {
//   domainAverages: {
//     cognitive: 2.1,
//     emotional: 3.2,
//     social: 2.8,
//     behavioral: 1.9,
//   },
//   evaluationCount: 14,
//   lastEvaluation: "2026-08-20",
//   riskLevel: "HIGH",
// };

// /** No evaluations yet — tests the empty state. */
// export const mockSnapshotEmpty: WholeChildSnapshotData = {
//   domainAverages: {
//     cognitive: null,
//     emotional: null,
//     social: null,
//     behavioral: null,
//   },
//   evaluationCount: 0,
//   lastEvaluation: null,
//   riskLevel: "NONE",
// };