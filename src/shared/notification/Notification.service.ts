import { io, Socket } from "socket.io-client";
import { API_CONFIG } from "../../config/api.config";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  targetPath?: string | null;
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  studentId: number | null;
  studentName: string | null;
  refKey: string | null;
  isRead: boolean;
  createdAt: string;
}

interface RawNotification {
  target_path?: string | null;
  id: number;
  user_id: number;
  student_id: number | null;
  student_name: string | null;
  ref_key: string | null;
  title: string;
  message: string;
  type: NotificationType;
  is_read: number | boolean; // tinyint(1) sa MySQL -> 0 / 1
  created_at: string;
}

interface SocketNotification {
  targetPath?: string | null;
  id: number;
  userId: number;
  studentId?: number | null;
  studentName: string | null;
  refKey: string | null;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

const fromApi = (n: RawNotification): Notification => ({
  id: n.id,
  title: n.title,
  message: n.message,
  type: n.type,
  studentId: n.student_id,
  studentName: n.student_name,
  refKey: n.ref_key,
  targetPath: n.target_path ?? null,
  isRead: Boolean(n.is_read),
  createdAt: n.created_at,
});

const fromSocket = (n: SocketNotification): Notification => ({
  id: n.id,
  title: n.title,
  message: n.message,
  type: n.type,
  studentId: n.studentId ?? null,
  studentName: n.studentName ?? null,
  refKey: n.refKey ?? null,
  targetPath: n.targetPath ?? null,
  isRead: n.isRead,
  createdAt: n.createdAt,
});

export interface NotificationRequestOptions { signal?: AbortSignal; onUnauthorized?: () => void }

async function request<T>(path: string, options: RequestInit & NotificationRequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_CONFIG.baseURL}${path}`, {
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    if (res.status === 401 && !options.signal?.aborted) options.onUnauthorized?.();
    const error = new Error(`Request failed (${res.status}) - ${path}`);
    Object.assign(error, {status: res.status});
    throw error;
  }
  return res.json() as Promise<T>;
}

export const notificationService = {
  async getAll(userId: number | string, options: NotificationRequestOptions = {}): Promise<Notification[]> {
    const res = await request<{ success: boolean; data: RawNotification[] }>(
      `/api/notification/${userId}`, options
    );
    return res.data.map(fromApi);
  },

  async markAsRead(id: number, options: NotificationRequestOptions = {}): Promise<void> {
    await request<{ success: boolean }>(`/api/notification/${id}/read`, {
      method: "PATCH", ...options,
    });
  },

  async notifyMissing(subjectSectionId: number | string, itemId: number | string) {
    return request<{ success: boolean; missing: number; notified: number }>(
      `/api/<PREFIX>/${subjectSectionId}/items/${itemId}/notify-missing`,
      { method: "POST" }
    );
  },

  async markAllAsRead(userId: number | string, options: NotificationRequestOptions = {}): Promise<void> {
  await request<{ success: boolean }>(
    `/api/notification/user/${userId}/read-all`,
    { method: "PATCH", ...options }
  );
},

  subscribe(userId: number | string, onNew: (n: Notification) => void, onConnect?: () => void): () => void {
  const socket: Socket = io(`${API_CONFIG.baseURL}`, { withCredentials: true });

  socket.on("connect", () => {
    socket.emit("join", `user:${userId}`);
    onConnect?.();
  });

  socket.on("notification:new", (n: SocketNotification) => {
    onNew(fromSocket(n));
  });

  return () => {
    socket.disconnect();
  };
},
};
