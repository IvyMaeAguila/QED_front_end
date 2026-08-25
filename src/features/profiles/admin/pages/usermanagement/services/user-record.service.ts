import { API_CONFIG } from '../../../../../../config/api.config';

const BASE_URL = `${API_CONFIG.baseURL}/api/user`;

export const UserService = {
  async getAllUsers() {
    const response = await fetch(`${BASE_URL}/usersList`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch users");
    }
    const result = await response.json();
    return result.data;
  },

  async getUserById(role: string, id: string) {
    const response = await fetch(`${BASE_URL}/getUser/${role.toLowerCase()}/${id}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch user");
    }
    const result = await response.json();
    return result.data;
  },


  async addUser(payload: any) {
    const response = await fetch(`${BASE_URL}/addUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to add new user");
    }
    return response.json();
  },

  async updateUser(id: string, payload: any) {
    const response = await fetch(`${BASE_URL}/editUser/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update user");
    }
    return response.json();
  },

  async deleteUser(id: string, role: string) {
    const response = await fetch(`${BASE_URL}/deleteUser/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete user");
    }
    return response.json();
  },
};