import type { UserProfile } from "../types/types";
import { API_CONFIG } from "../../../config/api.config";

const BASE_URL = `${API_CONFIG.baseURL}/api`;

export async function getMyProfile(): Promise<UserProfile> {
  const response = await fetch(`${BASE_URL}/user-profile/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // ipadala ang cookie
  });

  if (!response.ok) {
    let message = "Failed to fetch profile";
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {

    }
    throw new Error(message);
  }

  return (await response.json()) as UserProfile;
}

export const profileService = { getMyProfile };