import { API_CONFIG } from '../../../../../../config/api.config';
import type { DailyUpdate  } from '../types/student';

const BASE_API = `${API_CONFIG.baseURL}/api`;

export interface UserData {
  id: string;
  full_name: string;
  contact_number?: string;
  email_address?: string;
  address?: string;
}

export interface PerformanceTrendPoint {
  term: string;
  performance: number | null;
  attendance: number | null;
  cognitive: number | null;
  emotional: number | null;
  behavioral: number | null;
  social: number | null;
  holisticAverage: number | null;
  overall: number | null;
}

interface ProfileResponse {
  success: boolean;
  message?: string;
  data?: UserData;
}

interface DailyUpdatesResponse {
  success: boolean;
  message?: string;
  dailyUpdates: DailyUpdate[];
}

export async function getUserData(): Promise<UserData> {
  const response = await fetch(`${BASE_API}/profile/`, {
    method: "GET",
    credentials: "include", // sends the auth cookie automatically
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status === 401) {
    throw new Error("Session expired. Please log in again.");
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch profile (status ${response.status})`);
  }
  const result: ProfileResponse = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.message || "Unable to retrieve user data.");
  }
  return result.data;
}

export const dailyUpdateService = {
  async getDailyUpdatesForParent(): Promise<DailyUpdatesResponse> {
    try {
      const response = await fetch(`${BASE_API}/parent-dashboard/parent`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        return {
          success: false,
          message: "Session expired. Please log in again.",
          dailyUpdates: [],
        };
      }

      if (!response.ok) {
        return {
          success: false,
          message: `Failed to fetch daily updates (status ${response.status})`,
          dailyUpdates: [],
        };
      }

      const data: DailyUpdate[] = await response.json();
      return { success: true, dailyUpdates: data };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || "Failed to load daily updates.",
        dailyUpdates: [],
      };
    }
  },
};
