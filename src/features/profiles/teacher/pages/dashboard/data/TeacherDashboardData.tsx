import type { AgendaItem } from "../components/TodayAgenda";
import type { EventItem } from "../components/UpcomingEvents";


export const TEACHER_EVENTS: EventItem[] = [
  { id: "1", time: "Today @ 1:00pm", title: "Parents General Meeting" },
  { id: "2", time: "Tomorrow @ 4:00pm", title: "Faculty Meeting" },
];

export const TEACHER_AGENDA: AgendaItem[] = [
  { id: "1", time: "8:00 - 9:00 AM", subject: "Mathematics 7A" },
  { id: "2", time: "9:15 - 10:15 AM", subject: "Mathematics 7B" },
  { id: "3", time: "10:30 - 11:30 AM", subject: "Mathematics 8A" },
  { id: "4", time: "1:00 - 2:00 PM", subject: "Mathematics 8B" },
];
