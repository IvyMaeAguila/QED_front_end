import { lazy, Suspense, useCallback, createContext, useContext, useState, type ReactNode } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { useAuth } from "../../features/auth/context/authContext";
import { notificationService, type Notification } from "./Notification.service";

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  activateAdminQueries?:()=>void;
  activateParentQueries?:()=>void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

function LegacyNotificationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, sessionScope } = useAuth();
  const identity = `${sessionScope}:${user?.role}:${user?.id}`;
  const [legacyIdentity, setLegacyIdentity] = useState<string | null>(null);
  const [legacyUpdatedAt,setLegacyUpdatedAt]=useState(0);
  const [adminActivation,setAdminActivation]=useState<{identity:string;seed?:{data:Notification[];updatedAt:number}}>();
  const [parentActivation,setParentActivation]=useState<string>();
  const activateParentQueries=useCallback(()=>{if(!isLoading&&user?.role==='PARENT'&&navigator.onLine)setParentActivation(identity);},[identity,isLoading,user?.role]);
  const queryMode = !isLoading && (user?.role === "PRINCIPAL" || user?.role === "TEACHER" || user?.role === "PARENT"&&parentActivation===identity || user?.role==='ADMIN'&&adminActivation?.identity===identity);
  const [querySnapshot, setQuerySnapshot] = useState<{identity:string;value:NotificationContextType | null} | null>(null);
  const queryState = querySnapshot?.identity === identity ? querySnapshot.value : null;
  const publish = useCallback((value: NotificationContextType | null) => {
    setQuerySnapshot({identity, value});
    setAdminActivation(previous=>previous?.identity===identity&&previous.seed?{identity}:previous);
  }, [identity]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const activateAdminQueries=useCallback(()=>{if(navigator.onLine&&!isLoading&&user?.role==='ADMIN')setAdminActivation(previous=>previous?.identity===identity?previous:{identity,seed:legacyIdentity===identity&&legacyUpdatedAt?{data:notifications,updatedAt:legacyUpdatedAt}:undefined});},[isLoading,user?.role,identity,legacyIdentity,legacyUpdatedAt,notifications]);

  useEffect(() => {
    if(user?.role==='PARENT'&&!queryMode)return;
    if (isLoading || queryMode) {if(queryMode&&user?.role==='ADMIN')setNotifications(previous=>previous.length?[]:previous);return;}
    if (!user) {
      setNotifications([]);
      return;
    }

    let cancelled = false;
    const controller=new AbortController();
    setNotifications([]);
    setLegacyUpdatedAt(0);
    setLegacyIdentity(identity);
    const refresh = () => {
      notificationService.getAll(user.id,user.role==='ADMIN'?{signal:controller.signal}:undefined).then((items) => {
        if (cancelled) return;
        if(user.role==='ADMIN')setLegacyUpdatedAt(Date.now());
        setNotifications((previous) => {
          const fetchedIds = new Set(items.map((n) => n.id));
          return [...previous.filter((n) => !fetchedIds.has(n.id)), ...items]
            .sort((a, b) => b.id - a.id);
        });
      }).catch(error => {if(!cancelled&&user.role==='ADMIN'&&error instanceof Error&&'status'in error&&[401,403].includes(Number(error.status))){setNotifications([]);setLegacyUpdatedAt(0);}});
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
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      unsubscribe();
    };
  }, [user, isLoading, queryMode, identity]);

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
      value={{...(queryMode ? queryState ?? emptyNotifications : legacyIdentity === identity ? { notifications, unreadCount, markAsRead, markAllAsRead } : emptyNotifications),activateAdminQueries,activateParentQueries}}
    >
      {queryMode && <Suspense fallback={null}>{user?.role==='ADMIN'
        ? <AdminNotifications key={identity} onChange={publish} expectedRole="ADMIN" seed={adminActivation?.seed}/>:user?.role === "TEACHER"
        ? <TeacherNotifications key={identity} onChange={publish} expectedRole="TEACHER"/>
        :user?.role === "PARENT" ? <ParentNotifications key={identity} onChange={publish} expectedRole="PARENT"/>
        : <PrincipalNotifications key={identity} onChange={publish}/>}</Suspense>}
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

const PrincipalNotifications = lazy(() => import("./PrincipalNotificationQueries"));
const TeacherNotifications = lazy(() => import("./AuthenticatedNotificationQueries"));
const AdminNotifications = lazy(() => import("./AuthenticatedNotificationQueries"));
const ParentNotifications = lazy(() => import("./AuthenticatedNotificationQueries"));
const emptyNotifications = {notifications: [], unreadCount: 0, markAsRead: () => {}, markAllAsRead: () => {}};
export function NotificationProvider({children}: {children: ReactNode}) {
  return <LegacyNotificationProvider>{children}</LegacyNotificationProvider>;
}
