import {
  fetchHolisticOverview,
  fetchHolisticWeekly,
  type WeeklyAxisScores,
} from "./holistic.service";

export interface DomainWeekPoint {
  weekStartDate: string;
  cognitive: number | null;
  emotional: number | null;
  behavioral: number | null;
  social: number | null;
}

export interface SubjectDomainTrend {
  subjectSectionId: string;
  subjectName: string;
  studentCount: number;
  weeks: DomainWeekPoint[];
}

export interface DomainTrendsOverview {
  termNumber: number;
  subjects: SubjectDomainTrend[];
  overallWeeks: DomainWeekPoint[];
}

function averageDefined(values: (number | null)[]): number | null {
  const defined = values.filter((v): v is number => v !== null);
  return defined.length
    ? Math.round((defined.reduce((a, b) => a + b, 0) / defined.length) * 10) / 10
    : null;
}

function averageWeeksAcrossRecords(recordsWeeks: WeeklyAxisScores[][]): DomainWeekPoint[] {
  const byDate = new Map<string, WeeklyAxisScores[]>();
  for (const weeks of recordsWeeks) {
    for (const week of weeks) {
      const list = byDate.get(week.weekStartDate) ?? [];
      list.push(week);
      byDate.set(week.weekStartDate, list);
    }
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStartDate, weeks]) => ({
      weekStartDate,
      cognitive: averageDefined(weeks.map((w) => w.cognitive)),
      emotional: averageDefined(weeks.map((w) => w.emotional)),
      behavioral: averageDefined(weeks.map((w) => w.behavioral)),
      social: averageDefined(weeks.map((w) => w.social)),
    }));
}

export async function fetchDomainTrendsOverview(termNumber: number): Promise<DomainTrendsOverview> {
  const students = await fetchHolisticOverview(termNumber);

  const subjectMap = new Map<string, string>();
  for (const student of students) {
    for (const subject of student.subjects) {
      if (!subjectMap.has(subject.subjectSectionId)) {
        subjectMap.set(subject.subjectSectionId, subject.subjectName);
      }
    }
  }

  const perSubjectRecords = await Promise.all(
    Array.from(subjectMap.entries()).map(async ([subjectSectionId, subjectName]) => {
      const { data } = await fetchHolisticWeekly(subjectSectionId, termNumber);
      const allRecords = Object.values(data);
      const recordsWeeks = allRecords.map((record) => record.weeks);
      const studentCount = allRecords.filter((record) =>
        record.weeks.some(
          (week) =>
            week.cognitive !== null ||
            week.emotional !== null ||
            week.behavioral !== null ||
            week.social !== null
        )
      ).length;
      return { subjectSectionId, subjectName, recordsWeeks, studentCount };
    })
  );

  const subjects: SubjectDomainTrend[] = perSubjectRecords.map((s) => ({
    subjectSectionId: s.subjectSectionId,
    subjectName: s.subjectName,
    studentCount: s.studentCount,
    weeks: averageWeeksAcrossRecords(s.recordsWeeks),
  }));

  const overallWeeks = averageWeeksAcrossRecords(perSubjectRecords.flatMap((s) => s.recordsWeeks));

  return { termNumber, subjects, overallWeeks };
}

//Explanation section hehe

// Class-wide, per-domain weekly trend data — NOT per student. Backs the
// "Holistic domain trends" page: one line chart per domain (cognitive,
// emotional, behavioral, social), averaged across every student in a
// subject, with an "Overall" tab that averages across every subject the
// teacher teaches.
//
// There is no backend endpoint for a pre-aggregated class-wide weekly
// average, so this file computes one by:
//   1. Deriving the distinct subjects taught from fetchHolisticOverview
//      (every student's subjects[] entry already carries subjectSectionId
//      + subjectName — there's no separate "my subjects" endpoint).
//   2. Pulling each subject's per-student weekly records via
//      fetchHolisticWeekly, then averaging per domain per week across
//      students.
//   3. "Overall" pools every subject's raw student-week records together
//      (not an average-of-averages) so subjects with more students aren't
//      under- or over-weighted relative to their actual data volume.
