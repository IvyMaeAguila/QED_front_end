import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { useAuth } from "../../features/auth/context/authContext";
import { notificationService, type Notification } from "./Notification.service";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setNotifications([]);
      return;
    }

    let cancelled = false;
    setNotifications([]);
    const refresh = () => {
      notificationService.getAll(user.id).then((items) => {
        if (cancelled) return;
        setNotifications((previous) => {
          const fetchedIds = new Set(items.map((n) => n.id));
          return [...previous.filter((n) => !fetchedIds.has(n.id)), ...items]
            .sort((a, b) => b.id - a.id);
        });
      }).catch(() => {});
    };
    refresh();
    const unsubscribe = notificationService.subscribe(user.id, (notif) => {
      if (cancelled) return;
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
    }, refresh);
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      unsubscribe();
    };
  }, [user, isLoading]);

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    notificationService.markAsRead(id).catch(() => {});
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (user) notificationService.markAllAsRead(user.id).catch(() => {});
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
}
