const BASE_URL = "http://localhost:7400/api/auth";

export interface RegisterPayload {
  userName: string;
  password: string;
  role: string;
  userId?: string | number; 
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
};