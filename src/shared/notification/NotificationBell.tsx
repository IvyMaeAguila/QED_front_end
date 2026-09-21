import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCircle2, ClipboardX, Info, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom"; // "react-router" kung v7 ang gamit mo
import { useNotifications } from "./NotificationContext";
import type { Notification, NotificationType } from "./Notification.service";
// ayusin ang path depende kung nasaan ang file
import { useSettings } from "../../features/profiles/admin/pages/settings/context/SettingsContext";

type Tab = "today" | "week" | "earlier";

const TABS: { key: Tab; label: string; empty: string }[] = [
  { key: "today", label: "Today", empty: "No notifications today" },
  { key: "week", label: "This Week", empty: "No notifications this week" },
  { key: "earlier", label: "Earlier", empty: "No earlier notifications" },
];

// warning = Missed Activity (clipboard na may X)
const TYPE_ICON: Record<NotificationType, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: ClipboardX,
  error: XCircle,
};

const TYPE_COLOR: Record<NotificationType, { light: string; dark: string }> = {
  info: { light: "text-blue-700", dark: "text-blue-400" },
  success: { light: "text-green-700", dark: "text-green-400" },
  warning: { light: "text-[#6B0000]", dark: "text-[#F87171]" },
  error: { light: "text-red-700", dark: "text-red-400" },
};

const DAY_MS = 24 * 60 * 60 * 1000;

// /parent/students/:studentId  (ang tab ay pinipili sa loob ng page)
const studentRoute = (studentId: number) => `/parent/students/${studentId}`;

function getRoute(n: Notification): { path: string; tab: string } | null {
  if (n.studentId == null) return null;

  const title = n.title.toLowerCase();
  if (title.includes("missed activity")) {
    return { path: studentRoute(n.studentId), tab: "academic" };
  }
  if (title.includes("weekly evaluation")) {
    return { path: studentRoute(n.studentId), tab: "holistic" };
  }
  if (title.includes("grades released")) {
    return { path: studentRoute(n.studentId), tab: "progressReport" };
  }
  return null; // ibang uri ng notification: walang lilipatan
}

// "today" na version ng Absent notif kapag nasa Today tab pa; kung hindi, gamitin na lang
// yung dated message galing backend (may "on {date}" na)
function getDisplayMessage(n: Notification, tab: Tab) {
  if (tab === "today" && n.title === "Absent" && n.studentName) {
    const firstName = n.studentName.split(" ")[0];
    return `${firstName} was marked absent today.`;
  }
  return n.message;
}

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Today = ngayong araw, This Week = nakaraang 6 na araw, Earlier = mas luma pa
function getBucket(iso: string, now: Date): Tab {
  const t = new Date(iso).getTime();
  const today = startOfDay(now);
  if (t >= today) return "today";
  if (t >= today - 6 * DAY_MS) return "week";
  return "earlier";
}

// "Sept 19 | 5:30 PM"
function formatStamp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .replace(/^Sep\b/, "Sept");
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} | ${time}`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const { darkMode } = useSettings();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);

    const route = getRoute(n);
    if (route) {
      setOpen(false); // isara ang dropdown
      navigate(route.path, { state: { tab: route.tab } });
    }
  };

  // Isara kapag nag-click sa labas o pumindot ng Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const grouped = useMemo(() => {
    const now = new Date();
    const g: Record<Tab, Notification[]> = { today: [], week: [], earlier: [] };
    for (const n of notifications) g[getBucket(n.createdAt, now)].push(n);
    return g;
  }, [notifications]);

  const visible = grouped[tab];
  const activeTab = TABS.find((t) => t.key === tab)!;

  // --- kulay ---
  const panelBg = darkMode ? "bg-[#111827]" : "bg-white";
  const panelBorder = darkMode ? "border-[#374151]" : "border-[#E5E7EB]";
  const text = darkMode ? "text-white" : "text-[#111827]";
  const muted = darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]";
  const divider = darkMode ? "border-[#1F2937]" : "border-[#D1D5DB]";
  const hover = darkMode ? "hover:bg-[#1F2937]/60" : "hover:bg-[#F9FAFB]";
  const tabsWrap = darkMode ? "bg-[#1F2937]" : "bg-[#F0F0F0]";
  const tabActive = darkMode
    ? "bg-[#374151] text-white shadow-sm"
    : "bg-white text-[#111827] shadow-sm";
  const tabIdle = darkMode
    ? "text-[#9CA3AF] hover:text-white"
    : "text-[#9CA3AF] hover:text-[#6B7280]";
  const bubble = darkMode
    ? "bg-[#1F2937] text-[#E5E7EB]"
    : "bg-[#E9E9E9] text-[#111827]";
  const iconWrap = darkMode ? "bg-[#1F2937]" : "bg-[#F3F4F6]";
  // nabasa na: mas mapusyaw na kahon at text
  const readBubble = darkMode
    ? "bg-[#1F2937]/50 text-[#9CA3AF]"
    : "bg-[#F3F4F6] text-[#6B7280]";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative p-2 rounded-full transition-colors ${
          darkMode ? "hover:bg-[#6d6e6e3f]" : "hover:bg-[#F3F4F6]"
        } text-[#6B0000]`}
      >
        <Bell size={21} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-semibold leading-4 text-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-5 top-16 z-50 sm:left-auto sm:right-11 sm:w-104">
          <span
            aria-hidden
            className={`hidden sm:block absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t ${panelBg} ${panelBorder}`}
          />

          <div
            role="dialog"
            aria-label="Notifications"
            className={`relative flex max-h-128 flex-col overflow-hidden rounded-2xl border shadow-xl ${panelBg} ${panelBorder} ${text}`}
          >
            <div className="px-5 pt-5">
              <h2 className="text-sm font-semibold">Notification</h2>

              <div
                role="tablist"
                className={`mt-4 flex gap-1 rounded-lg p-1 ${tabsWrap}`}
              >
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${
                      tab === t.key ? tabActive : tabIdle
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 min-h-48 flex-1 overflow-y-auto scrollbar-none">
              {visible.length === 0 ? (
                <p className={`px-5 py-12 text-center text-sm ${muted}`}>
                  {activeTab.empty}
                </p>
              ) : (
                visible.map((n) => {
                  const Icon = TYPE_ICON[n.type] ?? Info;
                  const color = TYPE_COLOR[n.type] ?? TYPE_COLOR.info;

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleClick(n)}
                      className={`flex w-full items-center gap-3 border-b px-5 py-3 text-left transition-colors last:border-b-0 ${divider} ${hover}`}
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconWrap} ${
                          darkMode ? color.dark : color.light
                        } ${n.isRead ? "opacity-50" : ""}`}
                      >
                        <Icon size={22} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span
                            className={`truncate text-sm ${
                              n.isRead ? `font-semibold ${muted}` : "font-bold"
                            }`}
                          >
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span
                              aria-label="Unread"
                              className="h-2 w-2 shrink-0 rounded-full bg-[#DC2626]"
                            />
                          )}
                          <span
                            className={`ml-auto shrink-0 whitespace-nowrap text-[10px] ${muted}`}
                          >
                            {formatStamp(n.createdAt)}
                          </span>
                        </span>

                        <span
                          className={`mt-1 block wrap-break-word rounded-md px-3 py-2 text-xs ${
                            n.isRead ? readBubble : bubble
                          }`}
                        >
                          {getDisplayMessage(n, tab)}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div
              className={`flex justify-end border-t px-5 py-3 ${divider}`}
            >
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-sm font-medium transition-opacity hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-40"
              >
                Mark all as read
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}