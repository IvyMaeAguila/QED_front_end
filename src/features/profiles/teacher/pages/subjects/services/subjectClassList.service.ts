const BASE_URL = "http://localhost:7400/api/mySubjects";

export interface SubjectClassListStudentRow {
  student_id: number;
  student_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: "Male" | "Female";
}

export interface SubjectClassListRow {
  subject_name: string;
  grade_level: string;
  section_name: string;
  students: SubjectClassListStudentRow[];
}

export interface SubjectClassListStudent {
  studentId: number;
  studentNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: "Male" | "Female";
}

export interface SubjectClassList {
  subjectName: string;
  gradeLevel: string;
  sectionName: string;
  students: SubjectClassListStudent[];
}

function mapStudentRow(row: SubjectClassListStudentRow): SubjectClassListStudent {
  return {
    studentId: row.student_id,
    studentNumber: row.student_number,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    gender: row.gender,
  };
}

export const subjectClassListService = {
  // Assumes a REST pattern consistent with /mySubjects/subjects — adjust
  // the path below if your backend route differs.
  async getClassList(subjectSectionId: number): Promise<SubjectClassList> {
    const response = await fetch(`${BASE_URL}/subjects/${subjectSectionId}/students`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      throw new Error("Unauthorized: kailangan mag-login muna.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch class list");
    }

    const json = await response.json();
    const data: SubjectClassListRow = json.data ?? {};

    return {
      subjectName: data.subject_name ?? "",
      gradeLevel: data.grade_level ?? "",
      sectionName: data.section_name ?? "",
      students: (data.students ?? []).map(mapStudentRow),
    };
  },
};