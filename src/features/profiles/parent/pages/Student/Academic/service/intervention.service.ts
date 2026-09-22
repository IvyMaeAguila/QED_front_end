import { API_CONFIG } from '../../../../../../../config/api.config';

import type { InterventionFlag } from "../types/types";

const API_BASE_URL = `${API_CONFIG.baseURL}/api/lowGradeTopics`;

interface RawLowGradeTopic {
  topic_id: number;
  topic_name: string;
  subject_name: string;
  average_percent: number;
  latest_percent?: number | null;
  items_scored: number;
  mastery_threshold: number;
  developing_threshold: number;
  is_archived?: boolean;
  archived_at?: string | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function getLatest(raw: RawLowGradeTopic): number | null {
  return raw.latest_percent === null || raw.latest_percent === undefined
    ? null
    : Number(raw.latest_percent);
}

function formatConcern(raw: RawLowGradeTopic): string {
  const avg = Number(raw.average_percent);
  const latest = getLatest(raw);
  const threshold = raw.developing_threshold;

  // Flagged because of the latest score, even though the overall average is fine.
  if (latest !== null && latest < threshold && avg >= threshold) {
    return `Low score in ${raw.topic_name} (${raw.subject_name}): latest score is ${round1(latest)}%, below the ${threshold}% developing threshold (overall average ${round1(avg)}%).`;
  }

  return `Struggling in ${raw.topic_name} (${raw.subject_name}): averaging ${round1(avg)}%, below the ${threshold}% developing threshold.`;
}

function getSeverity(raw: RawLowGradeTopic): InterventionFlag["severity"] {
  const latest = getLatest(raw);
  const lowest = latest === null ? Number(raw.average_percent) : Math.min(Number(raw.average_percent), latest);
  const gap = raw.developing_threshold - lowest;

  if (gap >= 20) return "high";
  if (gap >= 10) return "medium";
  return "low";
}

function mapToInterventionFlag(raw: RawLowGradeTopic): InterventionFlag {
  return {
    id: String(raw.topic_id),
    topicId: raw.topic_id,
    concern: formatConcern(raw),
    severity: getSeverity(raw),
  };
}

function isArchived(raw: RawLowGradeTopic): boolean {
  return raw.is_archived === true || !!raw.archived_at;
}

const LowGradeTopicsService = {
  async getLowGradeTopics(studentId: number | string): Promise<InterventionFlag[]> {
    const response = await fetch(`${API_BASE_URL}/${studentId}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store", // always refetch, so an archived topic disappears right away
    });

    if (!response.ok) {
      throw new Error("Failed to fetch low grade topics.");
    }

    const data: { lowGradeTopics: RawLowGradeTopic[] } = await response.json();

    return data.lowGradeTopics
      .filter((topic) => !isArchived(topic))
      .map(mapToInterventionFlag);
  },
};

export default LowGradeTopicsService;