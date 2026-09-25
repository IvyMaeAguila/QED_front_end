import { io, Socket } from "socket.io-client";
import { API_CONFIG } from "../../config/api.config";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  studentId: number | null;
  studentName: string | null;
  isRead: boolean;
  createdAt: string;
}

interface RawNotification {
  id: number;
  user_id: number;
  student_id: number | null;
  student_name: string | null;
  title: string;
  message: string;
  type: NotificationType;
  is_read: number | boolean; // tinyint(1) sa MySQL -> 0 / 1
  created_at: string;
}

interface SocketNotification {
  id: number;
  userId: number;
  studentId?: number | null;
  studentName: string | null;
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
  isRead: n.isRead,
  createdAt: n.createdAt,
});

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_CONFIG.baseURL}${path}`, {
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) - ${path}`);
  }
  return res.json() as Promise<T>;
}

export const notificationService = {
  async getAll(userId: number | string): Promise<Notification[]> {
    const res = await request<{ success: boolean; data: RawNotification[] }>(
      `/api/notification/${userId}`
    );
    return res.data.map(fromApi);
  },

  async markAsRead(id: number): Promise<void> {
    await request<{ success: boolean }>(`/api/notification/${id}/read`, {
      method: "PATCH",
    });
  },

  async notifyMissing(subjectSectionId: number | string, itemId: number | string) {
    return request<{ success: boolean; missing: number; notified: number }>(
      `/api/<PREFIX>/${subjectSectionId}/items/${itemId}/notify-missing`,
      { method: "POST" }
    );
  },

  async markAllAsRead(userId: number | string): Promise<void> {
  await request<{ success: boolean }>(
    `/api/notification/user/${userId}/read-all`,
    { method: "PATCH" }
  );
},

  subscribe(onNew: (n: Notification) => void): () => void {
    const socket: Socket = io(`${API_CONFIG.baseURL}`, { withCredentials: true });

    socket.on("notification:new", (n: SocketNotification) => {
      onNew(fromSocket(n));
    });

    return () => {
      socket.disconnect();
    };
  },
};
