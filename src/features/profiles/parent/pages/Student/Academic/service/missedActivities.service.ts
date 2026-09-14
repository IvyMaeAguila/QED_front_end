import { API_CONFIG } from '../../../../../../../config/api.config';

import type { MissedActivity } from "../types/types";

const API_BASE_URL = `${API_CONFIG.baseURL}api/missedActivities`;

interface RawMissedActivity {
  item_id: number;
  item_date: string;
  topic: string;
  activity_name: string;
  tab: "writtenWorks" | "performanceTask" | "exams";
  max_items: number;
  subject_name: string;
  score: number | null;
}

const TAB_TO_TYPE: Record<RawMissedActivity["tab"], MissedActivity["type"]> = {
  writtenWorks: "Written Works",
  performanceTask: "Performance Task",
  exams: "Examination",
};

function formatDueDate(itemDate: string): string {
  const date = new Date(itemDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapToMissedActivity(raw: RawMissedActivity): MissedActivity {
  return {
    id: String(raw.item_id),
    topic: raw.topic,
    subject: raw.subject_name,
    type: TAB_TO_TYPE[raw.tab],
    score: raw.score,
    maxItems: raw.max_items,
    dueDate: formatDueDate(raw.item_date),
  };
}

const MissedActivitiesService = {
  async getMissedActivities(studentId: number | string): Promise<MissedActivity[]> {
    const response = await fetch(`${API_BASE_URL}/${studentId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch missed activities.");
    }

    const data: { missedActivities: RawMissedActivity[] } = await response.json();

    // Backend na-filter na ng score IS NULL, pero safeguard pa rin dito
    return data.missedActivities
      .filter((item) => item.score === null)
      .map(mapToMissedActivity);
  },
};

export default MissedActivitiesService;