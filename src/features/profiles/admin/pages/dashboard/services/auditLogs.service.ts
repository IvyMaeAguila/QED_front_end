import { API_CONFIG } from "../../../../../../config/api.config";

export interface AuditLogEntry {
  id: number;
  actorUserId: number | null;
  actorFullName: string | null;
  actorUsername: string | null;
  actorRole: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  httpMethod: string;
  endpoint: string;
  statusCode: number;
  changedFields: string[] | string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  entries: AuditLogEntry[];
  page: number;
  limit: number;
  total: number;
}

export interface AuditLogFilters {
  page: number;
  search: string;
  role: string;
  action: string;
  from: string;
  to: string;
}

export async function fetchAuditLogs(filters: AuditLogFilters, signal?: AbortSignal): Promise<AuditLogPage> {
  const params = new URLSearchParams({
    page: String(filters.page), search: filters.search, role: filters.role,
    action: filters.action, from: filters.from, to: filters.to, limit: "20",
  });
  const response = await fetch(`${API_CONFIG.baseURL}/api/audit-logs?${params}`, {
    credentials: "include",
    signal,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) {
    throw new Error(body?.message || "Unable to load audit logs.");
  }
  return body.data as AuditLogPage;
}
