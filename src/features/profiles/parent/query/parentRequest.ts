import { boundedFetch as fetch, type HttpRequestInit } from '@shared/http/boundedFetch';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { QueryHttpError } from '@shared/http/QueryHttpError';

/** Stateless transport: authentication is checked before response parsing. */
export async function parentFetch(url: string, options: ApiRequestOptions = {}, init: HttpRequestInit = {}) {
  const response = await fetch(url, { credentials: 'include', ...init, signal: options.signal });
  if (response.status === 401 && !options.signal?.aborted) options.onUnauthorized?.();
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new QueryHttpError(body?.message || `Request failed (status ${response.status}).`, response.status, body?.outcome === 'uncertain' ? 'uncertain' : undefined, {requestId: response.requestId});
  }
  return response;
}
