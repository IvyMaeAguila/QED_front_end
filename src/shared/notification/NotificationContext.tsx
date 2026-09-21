import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../../features/auth/context/authContext";
import { notificationService, type Notification } from "./Notification.service";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isLoading || !user) return;

    notificationService
      .getAll(user.id)
      .then(setNotifications)
      .catch(() => {});

    const unsubscribe = notificationService.subscribe( (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return unsubscribe;
  }, [user, isLoading]);

  const markAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    notificationService.markAsRead(id).catch(() => {});
  };

  const markAllAsRead = () => {
  setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  if (user) notificationService.markAllAsRead(user.id).catch(() => {});
};

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}