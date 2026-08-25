const API_BASE_URL = 'http://localhost:7400';
const PROFILE_API_BASE = '/api/profile';

export interface UserData {
  id: string;
  full_name: string;
  contact_number?: string;
  email_address?: string;
  address?: string;
}

interface ProfileResponse {
  success: boolean;
  message?: string;
  data?: UserData;
}

export async function getUserData(): Promise<UserData> {
  const response = await fetch(`${API_BASE_URL}${PROFILE_API_BASE}/`, {
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