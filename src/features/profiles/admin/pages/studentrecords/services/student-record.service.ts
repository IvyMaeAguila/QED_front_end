const BASE_URL = "http://localhost:7400/api/student";

export const studentService = {
  // 1. Kukuha ng mga Grade Levels galing database
  async getGradeLevels(): Promise<string[]> {
    const response = await fetch(`${BASE_URL}/getGradeLevels`);
    if (!response.ok) throw new Error("Failed to fetch grade levels");
    return response.json();
  },

  async addNewStudent(payload: any) {
    const response = await fetch(`${BASE_URL}/addNewStudent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to add new student");
    }
    return response.json();
  },

  // 3. Mag-e-edit ng lumang estudyante
  // async updateStudent(id: string, payload: any) {
  //   const response = await fetch(`${BASE_URL}/updateStudent/${id}`, {
  //     method: "PUT",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(payload),
  //   });
  //   if (!response.ok) {
  //     const errorData = await response.json();
  //     throw new Error(errorData.message || "Failed to update student");
  //   }
  //   return response.json();
  // }
};