import { API_CONFIG } from '../../../../../../config/api.config';
import { QueryHttpError } from '@shared/http/QueryHttpError';
import type { UserAccount } from '../types/user';

export type UserWritePayload = Omit<UserAccount, 'id' | 'lastLogin' | 'gender'> & { userId?: string; gender?: 'Male' | 'Female' | '' | null };
export interface UserWriteResult { success: boolean; message?: string; data: UserAccount; credentialDelivery?: 'accepted' | 'failed' | 'test-recipient' }
export interface UserRequestOptions { signal?: AbortSignal; onUnauthorized?: () => void }
async function read(response: Response, fallback: string, options: UserRequestOptions) {
  if (response.status === 401 && !options.signal?.aborted) options.onUnauthorized?.();
  const data = await response.json().catch(() => undefined);
  if (!response.ok) throw new QueryHttpError(data?.message || fallback, response.status);
  return data;
}

const BASE_URL = `${API_CONFIG.baseURL}/api/user`;

export const UserService = {
  async getAllUsers(options: UserRequestOptions = {}): Promise<UserAccount[]> {
    const response = await fetch(`${BASE_URL}/usersList`, { credentials: "include", signal: options.signal });
    const result = await read(response, 'Failed to fetch users', options);
    if (!Array.isArray(result?.data)) throw new Error('Failed to fetch users');
    return result.data;
  },

  async getUserById(role: string, id: string) {
    const response = await fetch(`${BASE_URL}/getUser/${role.toLowerCase()}/${id}`, { credentials: "include" });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch user");
    }
    const result = await response.json();
    return result.data;
  },


  async addUser(payload: UserWritePayload, options: UserRequestOptions = {}): Promise<UserWriteResult> {
    const response = await fetch(`${BASE_URL}/addUser`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return read(response, 'Failed to add new user', options);
  },

  async updateUser(id: string, payload: UserWritePayload, options: UserRequestOptions = {}): Promise<UserWriteResult> {
    const response = await fetch(`${BASE_URL}/editUser/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return read(response, 'Failed to update user', options);
  },

  async deleteUser(id: string, role: string, options: UserRequestOptions = {}): Promise<UserWriteResult> {
    const response = await fetch(`${BASE_URL}/deleteUser/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    return read(response, 'Failed to delete user', options);
  },
};
