import type { CalendarEvent } from "./types/Calendar";

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

export function formatRelativeDay(dateStr: string): string {
  const today = new Date();
  const target = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((target.getTime() - new Date(toISODate(today) + "T00:00:00").getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return target.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatTimeRange(start?: string, end?: string): string | null {
  if (!start) return null;
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, "0")}${period}`;
  };
  return end ? `${fmt(start)} - ${fmt(end)}` : fmt(start);
}

// Seed data so the page isn't empty on first load. Swap for a real
// CalendarContext/backend  kimm
export function buildSeedEvents(): CalendarEvent[] {
  const today = new Date();
  const iso = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return toISODate(d);
  };

  return [
    {
      id: "evt-1",
      title: "Math Quiz - Grade 1",
      date: iso(1),
      startTime: "13:00",
      endTime: "14:00",
      audience: { roles: ["PARENT", "STUDENT"], gradeLevel: "Grade 1" },
      createdByRole: "TEACHER",
      createdByName: "Maria Santos",
    },
    {
      id: "evt-2",
      title: "English Quiz - Grade 1",
      date: iso(1),
      startTime: "07:00",
      endTime: "08:00",
      audience: { roles: ["PARENT", "STUDENT"], gradeLevel: "Grade 1" },
      createdByRole: "TEACHER",
      createdByName: "Maria Santos",
    },
    {
      id: "evt-3",
      title: "Science Quiz - Grade 1",
      date: iso(1),
      startTime: "08:00",
      endTime: "09:00",
      audience: { roles: ["PARENT", "STUDENT"], gradeLevel: "Grade 1" },
      createdByRole: "TEACHER",
      createdByName: "Maria Santos",
    },
    {
      id: "evt-4",
      title: "School-wide Flag Ceremony",
      date: iso(3),
      startTime: "07:00",
      endTime: "07:30",
      audience: { roles: ["ADMIN", "PRINCIPAL", "TEACHER", "PARENT", "STUDENT"] },
      createdByRole: "ADMIN",
      createdByName: "School Admin",
    },
    {
      id: "evt-5",
      title: "Faculty Meeting",
      date: iso(5),
      startTime: "15:00",
      endTime: "16:00",
      audience: { roles: ["ADMIN", "PRINCIPAL", "TEACHER"] },
      createdByRole: "PRINCIPAL",
      createdByName: "Principal's Office",
    },
  ];
}