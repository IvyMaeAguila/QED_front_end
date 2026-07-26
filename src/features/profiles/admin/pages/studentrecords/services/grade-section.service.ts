const BASE_URL = 'http://localhost:7400/api/gradeLevel';

export interface DBGradeLevelResponse {
  id: number; 
  grade_level: string; 
}

export const fetchGradeLevels = async (): Promise<DBGradeLevelResponse[]> => {
  try {
    const response = await fetch(`${BASE_URL}/getGradeLevels`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch grade levels: ${response.statusText}`);
    }
    
    const rawData: DBGradeLevelResponse[] = await response.json();
    return rawData;
  } catch (error) {
    console.error("Error in gradeService:", error);
    throw error;
  }
};

export interface DBSectionResponse {
  id: number;
  section_name: string;
  grade_level: string
}

export const fetchSectionByGrade = async (gradeLevelId: string | number): Promise<DBSectionResponse[]> => {
  try {
    // Ginawang gradeLevelId ang variable para tugma sa query parameter ng backend natin
    const response = await fetch(`${BASE_URL}/getSectionByGrade?gradeLevelId=${encodeURIComponent(gradeLevelId)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sections: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error in sectionService:", error);
    throw error;
  }
};