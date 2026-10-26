import { boundedFetch as fetch } from '@shared/http/boundedFetch';
import { API_CONFIG } from '../../../../../../config/api.config';
import { QueryHttpError } from "@shared/http/QueryHttpError";

interface DashboardRequestOptions { signal?: AbortSignal; onUnauthorized?: () => void }


const USER_BASE_URL = `${API_CONFIG.baseURL}/api/user`; 
const STUDENT_BASE_URL = `${API_CONFIG.baseURL}/api/student`; 

export interface UserCountsResponse {
  totalUsers: number;
  totalTeachers: number;
  totalParents: number;
}

export interface DashboardCounts extends UserCountsResponse {
  totalStudents: number;
}

export const DashboardService = {
  async getUserCounts(options: DashboardRequestOptions = {}): Promise<UserCountsResponse> {
    const response = await fetch(`${USER_BASE_URL}/totalUser`, {
      method: "GET",
      credentials: "include",
      signal: options.signal,
    });
    if (response.status === 401) options.onUnauthorized?.();

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new QueryHttpError(errorData?.message || "Failed to fetch user counts", response.status, undefined, {requestId: response.requestId});
    }

    return response.json();
  },

  async getTotalStudents(options: DashboardRequestOptions = {}): Promise<number> {
    const response = await fetch(`${STUDENT_BASE_URL}/totalStudents`, {
      method: "GET",
      credentials: "include",
      signal: options.signal,
    });
    if (response.status === 401) options.onUnauthorized?.();

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new QueryHttpError(errorData?.message || "Failed to fetch total students", response.status, undefined, {requestId: response.requestId});
    }

    const data = await response.json(); // { success, total }
    return data.total;
  },

  async getDashboardCounts(options: DashboardRequestOptions = {}): Promise<DashboardCounts> {
    const [userCounts, totalStudents] = await Promise.all([
      this.getUserCounts(options),
      this.getTotalStudents(options),
    ]);

    return {
      ...userCounts,
      totalStudents,
    };
  },
};
