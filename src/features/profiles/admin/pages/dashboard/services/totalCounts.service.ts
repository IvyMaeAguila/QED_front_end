const USER_BASE_URL = "http://localhost:7400/api/user"; // adjust sa totoong prefix mo
const STUDENT_BASE_URL = "http://localhost:7400/api/student"; // adjust din ito base sa route mount mo

export interface UserCountsResponse {
  totalUsers: number;
  totalTeachers: number;
  totalParents: number;
}

export interface DashboardCounts extends UserCountsResponse {
  totalStudents: number;
}

export const DashboardService = {
  async getUserCounts(): Promise<UserCountsResponse> {
    const response = await fetch(`${USER_BASE_URL}/totalUser`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch user counts");
    }

    return response.json();
  },

  async getTotalStudents(): Promise<number> {
    const response = await fetch(`${STUDENT_BASE_URL}/totalStudents`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch total students");
    }

    const data = await response.json(); // { success, total }
    return data.total;
  },

  async getDashboardCounts(): Promise<DashboardCounts> {
    const [userCounts, totalStudents] = await Promise.all([
      this.getUserCounts(),
      this.getTotalStudents(),
    ]);

    return {
      ...userCounts,
      totalStudents,
    };
  },
};