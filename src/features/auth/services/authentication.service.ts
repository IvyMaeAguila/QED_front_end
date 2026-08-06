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
  userName: string; 
  role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT"; 
  token: string;
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

  // Unwrap: backend returns { message, user: { id, user_name, role, token } }
  return {
    id: data.user.id,
    userName: data.user.user_name,
    role: data.user.role,
    token: data.user.token,
  };
},

async getMe() {
    const response = await fetch(`${BASE_URL}/me`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      return null; // walang session, hindi error, normal lang na scenario ito
    }
    const data = await response.json();
    return data.user;
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
};

