import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/teacherHolistic`;

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

/** One advisory section's domain trends. */
export interface DomainTrendsSection {
  classId: string;
  sectionId: string | null;
  sectionName: string;
  gradeLevel: string;
  subjects: SubjectDomainTrend[];
  overallWeeks: DomainWeekPoint[];
}

async function handleJsonResponse(res: Response) {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

/**
 * Domain trends for EVERY advisory section, from every subject those
 * students take (including subjects other teachers handle).
 */
export async function fetchDomainTrendsSections(termNumber: number): Promise<DomainTrendsSection[]> {
  const res = await fetch(`${BASE_URL}/domain-trends?termNumber=${termNumber}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const json = await handleJsonResponse(res);
  return json.data.sections as DomainTrendsSection[];
}

/**
 * Domain trends for ONE advisory section — pass the selected tab's
 * `classId` (from useSelectedAdvisorySection). Falls back to the first
 * section if no classId is given, so existing callers keep working.
 * Returns the same shape the Domain Trends page already renders.
 */
export async function fetchDomainTrendsOverview(
  termNumber: number,
  classId?: string
): Promise<DomainTrendsOverview> {
  const sections = await fetchDomainTrendsSections(termNumber);
  const match = classId ? sections.find((s) => s.classId === classId) : sections[0];
  return {
    termNumber,
    subjects: match?.subjects ?? [],
    overallWeeks: match?.overallWeeks ?? [],
  };
}

// Explanation
//
// Class-wide, per-domain weekly trend data — NOT per student. Backs the
// "Holistic domain trends" page: one line chart per domain (cognitive,
// emotional, behavioral, social), averaged across the students of ONE
// advisory section, with an "Overall" tab pooling every subject that
// section takes.
//
// The numbers are computed by GET /api/teacherHolistic/domain-trends. It
// covers every active subject in the section, not only the ones you teach,
// and it's separated per advisory section so each tab shows its own class.