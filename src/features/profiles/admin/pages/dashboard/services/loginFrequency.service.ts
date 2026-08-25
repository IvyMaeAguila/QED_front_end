import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/analytics`;

// services/loginFrequency.service.ts
//
// Service layer para sa /api/analytics/login-frequency endpoint.
// Gumagamit ng native `fetch`, cookie/session-based ang auth (tulad ng
// AuthService) — kaya laging kasama ang `credentials: "include"` at walang
// Authorization header na kailangang i-attach manually.

export type LoginFrequencyPeriod = "weekly" | "monthly" | "yearly";

export interface LoginFrequencyChartPoint {
  label: string;
  count: number;
}

export interface LoginFrequencySummary {
  peakLabel: string;
  peakCount: number;
  peakType: string; // "Peak Day" | "Peak Hour" | "Peak Month" | ...
  averageDaily: number;
  averageLabel: string; // "Avg. Daily Logins" | "Avg. Hourly Logins" | ...
  growthPercent: number;
  growthLabel: string; // "Weekly Growth" | "Daily Growth" | ...
}

export interface LoginFrequencyResponse {
  period: LoginFrequencyPeriod;
  chart: LoginFrequencyChartPoint[];
  summary: LoginFrequencySummary;
}

export class LoginFrequencyServiceError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "LoginFrequencyServiceError";
    this.status = status;
  }
}


/**
 * Kumuha ng login frequency chart + summary stats para sa given period.
 * Session-cookie based ang auth dito (`credentials: "include"`), kaparehas
 * ng AuthService — walang manual na Authorization header o localStorage
 * token, basta't naka-set na ang session cookie mula sa /auth/login.
 * Tumatapon ng LoginFrequencyServiceError kung hindi 2xx ang response.
 */
export async function getLoginFrequency(
  period: LoginFrequencyPeriod,
  signal?: AbortSignal,
): Promise<LoginFrequencyResponse> {
  let response: Response;
  try {
    response = await fetch(
      `${BASE_URL}/login-frequency?period=${encodeURIComponent(period)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal,
      },
    );
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new LoginFrequencyServiceError("Network error while fetching login frequency.");
  }

  if (!response.ok) {
    let message = `Failed to fetch login frequency (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore, non-JSON error body
    }
    throw new LoginFrequencyServiceError(message, response.status);
  }

  return response.json() as Promise<LoginFrequencyResponse>;
}