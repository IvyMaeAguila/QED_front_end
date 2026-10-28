import { parentFetch } from '../../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { API_CONFIG } from '../../../../../../../config/api.config';

const API_BASE_URL = `${API_CONFIG.baseURL}/api/courseware`;

export interface CoursewareVideo {
  title: string;
  url: string;
  thumbnailUrl: string;
  channelName: string;
}

export interface CoursewareDocument {
  title: string;
  content: string;
  generatedAt: string | null;
}

export interface CoursewareResource {
  cached: boolean;
  document: CoursewareDocument;
  videos: CoursewareVideo[];
  warning?: string;
}

interface RawCoursewareResponse {
  cached: boolean;
  document: {
    title: string;
    content: string;
    generatedAt?: string | null;
  };
  videos: {
    title: string;
    url: string;
    thumbnailUrl: string;
    channelName: string;
  }[];
  warning?: string;
  message?: string; // present on error responses
}

export async function getCourseware(
  studentId: string | number,
  topicId: string | number,
  options?: ApiRequestOptions
): Promise<CoursewareResource> {
  const response = await parentFetch(`${API_BASE_URL}/${studentId}/${topicId}`, options, {
    method: "GET", operation: "generation",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data: RawCoursewareResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? `Failed to load courseware (status ${response.status}).`);
  }

  return {
    cached: data.cached,
    document: {
      title: data.document.title,
      content: data.document.content,
      generatedAt: data.document.generatedAt ?? null,
    },
    videos: data.videos.map((v) => ({
      title: v.title,
      url: v.url,
      thumbnailUrl: v.thumbnailUrl,
      channelName: v.channelName,
    })),
    warning: data.warning,
  };
}