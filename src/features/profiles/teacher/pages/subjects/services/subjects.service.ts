const BASE_URL = "http://localhost:7400/api/mySubjects"; 
 
export interface AssignedSubjectRow {
  subject_section_id: number;
  subject_id: number;
  subject_code: string | null;
  subject_name: string;
  grade_level_id: number;
  grade_level: string;
  section_id: number;
  section_name: string;
}
 
export interface AssignedSubject {
  subjectSectionId: number;
  subjectId: number;
  subjectCode: string | null;
  subjectName: string;
  gradeLevelId: number;
  gradeLevel: string;
  sectionId: number;
  sectionName: string;
}
 
function mapAssignedSubjectRow(row: AssignedSubjectRow): AssignedSubject {
  return {
    subjectSectionId: row.subject_section_id,
    subjectId: row.subject_id,
    subjectCode: row.subject_code,
    subjectName: row.subject_name,
    gradeLevelId: row.grade_level_id,
    gradeLevel: row.grade_level,
    sectionId: row.section_id,
    sectionName: row.section_name,
  };
}
 
export const assignedSubjectsService = {
 
  // Token-based auth lang (Bearer header) - walang cookies/session, kaya walang
  // dapat na "credentials: include" sa fetch (dun nagmumula yung CORS wildcard error
  // kapag ang backend Access-Control-Allow-Origin ay "*").
  async getAssignedSubjects(): Promise<AssignedSubject[]> {
    const token = localStorage.getItem("token"); // adjust key/storage base sa auth setup mo
 
    const response = await fetch(`${BASE_URL}/subjects`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
 
    if (response.status === 401) {
      throw new Error("Unauthorized: kailangan mag-login muna.");
    }
 
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch assigned subjects");
    }
 
    const json = await response.json();
    const rows: AssignedSubjectRow[] = json.data ?? [];
    return rows.map(mapAssignedSubjectRow);
  },
 
};