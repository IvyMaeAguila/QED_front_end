import { fetchHolisticOverview, fetchHolisticWeekly, type WeeklyAxisScores } from "./holistic.service";
import type { DomainWeekPoint } from "./holisticTrends.service";

function averageDefined(values: (number | null)[]): number | null {
  const defined = values.filter((v): v is number => v !== null);
  return defined.length
    ? Math.round((defined.reduce((a, b) => a + b, 0) / defined.length) * 10) / 10
    : null;
}

function poolWeeks(weeksLists: WeeklyAxisScores[][]): DomainWeekPoint[] {
  const byDate = new Map<string, WeeklyAxisScores[]>();
  for (const weeks of weeksLists) {
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

export async function fetchAdvisoryDomainWeeks(termNumber: number): Promise<DomainWeekPoint[]> {
  const students = await fetchHolisticOverview(termNumber);
  const advisoryStudents = students.filter((s) => s.isAdvisory);
  const subjectIds = new Set<string>();
  for (const student of advisoryStudents) {
    for (const subject of student.subjects) subjectIds.add(subject.subjectSectionId);
  }

  const perSubjectData = await Promise.all(
    Array.from(subjectIds).map((subjectSectionId) => fetchHolisticWeekly(subjectSectionId, termNumber))
  );

  const advisoryIds = new Set(advisoryStudents.map((s) => s.studentId));
  const weeksLists: WeeklyAxisScores[][] = [];
  for (const { data } of perSubjectData) {
    for (const [studentId, record] of Object.entries(data)) {
      if (advisoryIds.has(studentId)) weeksLists.push(record.weeks);
    }
  }

  return poolWeeks(weeksLists);
}