import type { UserProfile } from "../../../shared/profile/types/types";

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


type AuthenticationTransport = typeof import("./authentication.transport").transport;
const loadTransport = () => import("./authentication.transport");

/** Keep authentication transport lazy without changing the public service API. */
export const AuthService: AuthenticationTransport = {
  updateProfile: async payload => (await loadTransport()).transport.updateProfile(payload),
  login: async payload => (await loadTransport()).transport.login(payload),
  getMe: async signal => (await loadTransport()).transport.getMe(signal),
  changePassword: async payload => (await loadTransport()).transport.changePassword(payload),
  logout: async () => (await loadTransport()).transport.logout(),
  requestPasswordReset: async payload => (await loadTransport()).transport.requestPasswordReset(payload),
  verifyOtp: async payload => (await loadTransport()).transport.verifyOtp(payload),
  resetPassword: async payload => (await loadTransport()).transport.resetPassword(payload),
};
