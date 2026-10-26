import { boundedFetch as fetch } from '@shared/http/boundedFetch';
import type { UserProfile } from "../types/types";
import { API_CONFIG } from "../../../config/api.config";
import { QueryHttpError } from "../../http/QueryHttpError";

const BASE_URL = `${API_CONFIG.baseURL}/api`;

export async function getMyProfile(signal?: AbortSignal): Promise<UserProfile> {
  const response = await fetch(`${BASE_URL}/user-profile/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // ipadala ang cookie
    signal,
  });

  if (!response.ok) {
    let message = "Failed to fetch profile";
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {

    }
    throw new QueryHttpError(message, response.status, undefined, {requestId: response.requestId});
  }

  return (await response.json()) as UserProfile;
}

export const profileService = { getMyProfile };
