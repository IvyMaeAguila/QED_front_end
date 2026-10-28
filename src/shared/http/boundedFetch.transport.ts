import { QueryHttpError } from './QueryHttpError';
import type { HttpRequestInit, BufferedHttpReply } from './boundedFetch';
const HTTP_DEADLINES = { read: 15_000, write: 30_000, upload: 60_000, export: 60_000, generation: 90_000 } as const;
const correlation = (headers: Headers) => { const value = headers.get('X-Request-ID'); return value && /^[a-zA-Z0-9-]{1,80}$/.test(value) ? value : undefined; };
interface Body { bytes: ArrayBuffer; text: string; parsed: unknown; malformed: boolean }
function reply(response: Response, body: Promise<Body>): BufferedHttpReply {
  let used = false;
  const consume = async () => { if (used) throw new TypeError('Response body already consumed.'); used = true; return body; };
  return { ok: response.ok, status: response.status, statusText: response.statusText, headers: response.headers,
    url: response.url, redirected: response.redirected, type: response.type, requestId: correlation(response.headers),
    get bodyUsed() { return used; },
    async json() { const data = await consume(); if (data.malformed) throw new SyntaxError('The server returned invalid JSON.'); return data.parsed; },
    async text() { return (await consume()).text; }, async arrayBuffer() { return (await consume()).bytes; },
    async blob() { return new Blob([(await consume()).bytes], { type: response.headers.get('content-type') || '' }); } };
}
/** Local API transport: bounded headers/body/parsing, no retries or native Response changes. */
export async function boundedFetch(input: RequestInfo | URL, init: HttpRequestInit = {}): Promise<BufferedHttpReply> {
  const { operation: explicit, keepUnauthorizedBody, ...request } = init;
  const method = (request.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const operation = explicit || (request.body instanceof FormData ? 'upload' : ['GET','HEAD'].includes(method) ? 'read' : 'write');
  const uncertain = operation === 'write' || operation === 'upload' || operation === 'generation';
  const parent = request.signal || (input instanceof Request ? input.signal : undefined);
  parent?.throwIfAborted();
  const controller = new AbortController();
  let response: Response | undefined, settled = false, bodyOwned = false;
  let rejectDeadline: (reason: unknown) => void = () => {};
  const failure = (code: string) => {
    const message = uncertain ? 'The request outcome could not be confirmed. Check stored data before trying again.' : code === 'HTTP_TIMEOUT' ? 'The request timed out. Please retry.' : 'Unable to reach the server. Please retry.';
    const details = { code, requestId: response && correlation(response.headers) };
    // Preserve native network-error identity and domain-specific uncertain-outcome messages.
    const error = response && response.status >= 400 ? new QueryHttpError(message, response.status, uncertain ? 'uncertain' : undefined, details)
      : Object.assign(code === 'HTTP_TIMEOUT' ? new Error(message) : new TypeError(message), details, { status:503, outcome:uncertain ? 'uncertain' : undefined });
    error.name = code === 'HTTP_TIMEOUT' ? 'TimeoutError' : 'TypeError';
    return error;
  };
  const stop = (reason: unknown) => { if (settled) return; controller.abort(reason); void response?.body?.cancel().catch(() => {}); rejectDeadline(reason); };
  const cancelled = () => stop(parent?.reason instanceof Error && parent.reason.name === 'TimeoutError' ? failure('HTTP_TIMEOUT') : parent?.reason || new DOMException('Request cancelled.', 'AbortError'));
  const deadline = new Promise<never>((_, reject) => { rejectDeadline = reject; });
  parent?.addEventListener('abort', cancelled, { once: true });
  const started = performance.now();
  const timer = setTimeout(() => stop(failure('HTTP_TIMEOUT')), HTTP_DEADLINES[operation]);
  const cleanup = () => { settled = true; clearTimeout(timer); parent?.removeEventListener('abort', cancelled); };
  const classify = (error: unknown) => {
    if (controller.signal.aborted) return controller.signal.reason;
    if (error instanceof Error && 'code' in error && ['HTTP_TIMEOUT','HTTP_NETWORK'].includes(String(error.code))) return error;
    return failure('HTTP_NETWORK');
  };
  const work = async (): Promise<BufferedHttpReply> => {
    try {
      response = await globalThis.fetch(input, { ...request, signal: controller.signal });
      if (controller.signal.aborted) { void response.body?.cancel().catch(() => {}); throw controller.signal.reason; }
      const readBody = async (): Promise<Body> => {
        try {
          const bytes = await response!.arrayBuffer();
          if (controller.signal.aborted) throw controller.signal.reason;
          const text = new TextDecoder().decode(bytes);
          let parsed: unknown, malformed = false;
          if (!(operation === 'export' && response!.ok)) { try { parsed = JSON.parse(text); } catch { malformed = true; } }
          if (performance.now() - started >= HTTP_DEADLINES[operation]) throw failure('HTTP_TIMEOUT');
          return { bytes, text, parsed, malformed };
        } catch (error) { throw classify(error); }
      };
      if (response.status === 401 && !keepUnauthorizedBody) {
        // Retain native header-first expiry AND actual error-body/outcome contracts.
        // The body owns a bounded lease; even an unconsumed/stalled401 cleans up.
        bodyOwned = true;
        const body = Promise.race([readBody(), deadline]).finally(cleanup);
        void body.catch(() => {});
        return reply(response, body);
      }
      return reply(response, Promise.resolve(await readBody()));
    } catch (error) { throw classify(error); }
  };
  try { return await Promise.race([work(), deadline]); }
  finally { if (!bodyOwned) cleanup(); }
}
