const BASE_URL = "http://localhost:7400/api/user";

export const UserService = {

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
  }

}
