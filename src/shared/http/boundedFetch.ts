export type HttpOperation = 'read' | 'write' | 'upload' | 'export' | 'generation';
export interface HttpRequestInit extends RequestInit {
  operation?: HttpOperation;
  keepUnauthorizedBody?: boolean;
}
export interface BufferedHttpReply extends Pick<Response, 'ok'|'status'|'statusText'|'headers'|'url'|'redirected'|'type'|'json'|'text'|'arrayBuffer'|'blob'|'bodyUsed'> {
  readonly requestId?: string;
}

// Keep operational transport code outside QED's public eager bundle.
export async function boundedFetch(input: RequestInfo | URL, init: HttpRequestInit = {}): Promise<BufferedHttpReply> {
  const transport = await import('./boundedFetch.transport');
  return transport.boundedFetch(input, init);
}
export function credentialFetch(input: RequestInfo | URL, init: HttpRequestInit = {}) { return boundedFetch(input, { ...init, keepUnauthorizedBody: true }); }
