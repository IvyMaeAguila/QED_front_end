const BASE_URL = "http://localhost:7400/api/auth";

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

export interface LoginResponse {
  id: string;
  email: string;
  role: "TEACHER" | "ADMIN";
  token: string;
}

export const AuthService = {
  async registerUser(payload: RegisterPayload) {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Invalid User ID or password.");
  }

  // Unwrap: backend returns { message, user: { id, user_name, role, token } }
  return {
    id: data.user.id,
    email: data.user.email ?? data.user.user_name, // walang email column, fallback sa user_name
    role: data.user.role,
    token: data.user.token,
  };
},
};