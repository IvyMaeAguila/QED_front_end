import type { ProgressReportData } from "../types/types";

export const mockProgressReportData: ProgressReportData = {
  meta: {
    learner: "Juan Santos",
    gradeSection: "Grade 2 - Rizal",
    classAdviser: "Mrs. Eleanor Sequijor",
    schoolYear: "2026 - 2027",
  },

  periodicRatings: [
    { learningArea: "Language", scores: { Q1: 97 }, finalRating: "Outstanding" },
    { learningArea: "Reading & Literacy", scores: { Q1: 75 }, finalRating: "Fairly Satisfactory" },
    { learningArea: "Mathematics", scores: { Q1: 97 }, finalRating: "Outstanding" },
    { learningArea: "Makabansa", scores: { Q1: 97 }, finalRating: "Outstanding" },
    { learningArea: "GMRC", scores: { Q1: 97 }, finalRating: "Outstanding" },
  ],

  quarterlyAverages: [
    { quarter: "Q1", average: 100, ratingLabel: "Outstanding" },
    { quarter: "Q2", average: null, ratingLabel: null },
    { quarter: "Q3", average: null, ratingLabel: null },
    { quarter: "Q4", average: null, ratingLabel: null },
  ],

  holisticAssessments: [
    {
      quarter: "Q1",
      domains: [
        { key: "cognitive", label: "Cognitive", score: 4.2, maxScore: 5, subtitle: "Performance, Comprehension" },
        { key: "emotional", label: "Emotional", score: 3.8, maxScore: 5, subtitle: "Motivation, Engagement" },
        { key: "social", label: "Social", score: 4.5, maxScore: 5, subtitle: "Participation, Teamwork" },
        { key: "behavioral", label: "Behavioral", score: 4.0, maxScore: 5, subtitle: "Attendance, Discipline" },
      ],
    },
  ],

  attendanceByQuarter: [
    {
      quarter: "Q1",
      months: [
        { month: "August", schoolDays: 20, present: 17, absent: 3, tardy: 5 },
        { month: "September", schoolDays: 18, present: 18, absent: 0, tardy: 3 },
        { month: "October", schoolDays: 21, present: 20, absent: 1, tardy: 0 },
      ],
    },
  ],
};