import { boundedFetch as fetch } from '@shared/http/boundedFetch';
import { API_CONFIG } from "../../../../../../config/api.config";
import { QueryHttpError } from "@shared/http/QueryHttpError";
import type { TeacherProfile } from "../data/types";

// Principal Query transport deliberately bypasses the legacy Admin service Map.
export async function fetchPrincipalTeacherProfile(id: string, signal: AbortSignal): Promise<TeacherProfile | null> {
  const response = await fetch(`${API_CONFIG.baseURL}/api/teachers/${encodeURIComponent(id)}`, {
    credentials: "include", signal,
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new QueryHttpError(`Failed to fetch teacher profile (${response.status})`, response.status, undefined, {requestId: response.requestId});
  return response.json();
}
