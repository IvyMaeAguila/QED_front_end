import type { UserProfile, Role } from "../../../shared/profile/types/types";
import { API_CONFIG } from '../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/auth`;

export interface RegisterPayload {
  userName: string;
  password: string;
  role: string;
  userId?: string | number;
}

export interface LoginPayload {
  userName: string;
  password: string;
}

export interface ChangePasswordPayload {
  newPassword: string;
}

export interface ForgotPasswordPayload {
  userName: string;
  email: string;
}

export interface VerifyOtpPayload {
  userName: string;
  otp: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}


// Intersection (hindi extends) dahil union type ang UserProfile
export type LoginResponse = UserProfile & { token: string; mustChangePassword: boolean };
export type MeResponse = UserProfile & { mustChangePassword: boolean };

function normalizeRole(role: string): Role {
  return role.toUpperCase() as Role;
}

function mapToUserProfile(raw: any): UserProfile {
  return {
    id: raw.id,
    userName: raw.user_name,
    role: normalizeRole(raw.role),
    name: raw.name,
    email: raw.email_address,
    contact: raw.contact_number,
    address: raw.address,
    subject: raw.subject,
    gradeLevel: raw.grade_level,
    section: raw.section,
  } as UserProfile;
}

export const AuthService = {
  async registerUser(payload: RegisterPayload) {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to add new user credentials");
    }
    return response.json();
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Invalid User ID or password.");
    }

    return {
      ...mapToUserProfile(data.user),
      token: data.user.token,
      mustChangePassword: !!data.user.mustChangePassword,
    } as LoginResponse;
  },

  async getMe(): Promise<MeResponse | null> {
    const response = await fetch(`${BASE_URL}/me`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      return null; // walang session, hindi error, normal lang na scenario ito
    }
    const data = await response.json();
    return {
      ...mapToUserProfile(data.user),
      mustChangePassword: !!data.user.mustChangePassword,
    } as MeResponse;
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