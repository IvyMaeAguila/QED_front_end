import { credentialFetch as fetch } from '@shared/http/boundedFetch';
import type { LoginPayload, LoginResponse, MeResponse, ChangePasswordPayload, ForgotPasswordPayload, VerifyOtpPayload, ResetPasswordPayload } from "./authentication.service";
import { API_CONFIG } from '../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/auth`;

export const transport = {
  async updateProfile(payload: { email?: string; phone?: string; address?: string; avatarKey?: string }): Promise<{ email?: string; phone?: string; address?: string; avatarKey?: string }> {
    const response = await fetch(`${BASE_URL}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || "Failed to update profile.");
    return data.profile;
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { loginSession } = await import("./sessionVerification.service");
    return loginSession(payload);
  },

  async getMe(signal?: AbortSignal): Promise<MeResponse | null> {
    const { getVerifiedSession } = await import("./sessionVerification.service");
    return getVerifiedSession(signal);
  },

  async changePassword(payload: ChangePasswordPayload) {
    const response = await fetch(`${BASE_URL}/change-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to change password.");
    }

    return data;
  },

  async logout() {
    const response = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Logout failed");
    }
    return response.json();
  },

  async requestPasswordReset(payload: ForgotPasswordPayload) {
  const response = await fetch(`${BASE_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to request password reset.");
  }
  return data;
},

async verifyOtp(payload: VerifyOtpPayload): Promise<{ resetToken: string }> {
  const response = await fetch(`${BASE_URL}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Invalid or expired OTP.");
  }
  return data;
},

async resetPassword(payload: ResetPasswordPayload) {
  const response = await fetch(`${BASE_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to reset password.");
  }
  return data;
},
};
