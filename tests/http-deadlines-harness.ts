import { boundedFetch, credentialFetch } from '../src/shared/http/boundedFetch';
import { isTransientReadFailure } from '../src/shared/query/safeReadPolicy';
import { QueryHttpError } from '../src/shared/http/QueryHttpError';
const w = window as any;
let releaseHeader: ((response: Response) => void) | undefined;
let releaseBody: (() => void) | undefined;
let caller: AbortController;
let requestSignal: AbortSignal | undefined;
const ownedTimers = new Set<number>();
const nativeSet = window.setTimeout.bind(window), nativeClear = window.clearTimeout.bind(window);
w.setTimeout = (fn: (...args:any[])=>void, ms:number, ...args:any[]) => { const id = nativeSet(()=>{ownedTimers.delete(id);fn(...args)},ms); if([15000,30000,60000,90000].includes(ms))ownedTimers.add(id); return id; };
w.clearTimeout = (id:number) => {ownedTimers.delete(id);nativeClear(id)};
const state: any = { ready: true };
Object.defineProperty(state,'activeTimers',{enumerable:true,get:()=>ownedTimers.size});
w.httpState = state;
w.startHttp = (options: any = {}) => {
 Object.assign(state,{calls:0,settled:false,result:undefined,error:undefined,aborted:false,bodyCancelled:false});
 caller = new AbortController(); releaseHeader=undefined; releaseBody=undefined;
 const headers = { 'Content-Type':options.binary?'application/octet-stream':'application/json', 'X-Request-ID':options.id || 'server-id-123' };
 const makeResponse = () => {
   const body = options.stallBody ? new ReadableStream<Uint8Array>({start(c){releaseBody=()=>{c.enqueue(new TextEncoder().encode(options.body || '{"value":94}'));c.close()}},cancel(){state.bodyCancelled=true}}) : options.body || '{"value":94}';
   return new Response(body,{status:options.status || 200,headers});
 };
 w.fetch = async (_input: any, init: RequestInit) => {
   state.calls++; requestSignal=init.signal!; requestSignal?.addEventListener('abort',()=>{state.aborted=true});
   if(options.network)throw new TypeError('private URL secret student');
   if(options.stallHeaders)return new Promise<Response>(resolve=>releaseHeader=resolve);
   return makeResponse();
 };
 w.releaseHttp = () => { if(releaseHeader)releaseHeader(makeResponse());else releaseBody?.(); };
 w.abortHttp = () => caller.abort();
 const request = (options.credential ? credentialFetch : boundedFetch)('/fake-api?token=private',{method:options.method || 'GET',signal:caller.signal,
   ...(options.upload?{method:'POST',body:new FormData()}:{}),...(options.operation?{operation:options.operation}:{})});
 void request.then(async reply=>{
   state.status=reply.status;state.requestId=reply.requestId;state.initialBodyUsed=reply.bodyUsed;
   if(options.noConsume){state.result='reply';return;}
   try { state.result=options.binary ? [...new Uint8Array(await reply.arrayBuffer())] : await reply.json(); }
   catch(error){state.parseError={name:(error as Error).name,message:(error as Error).message};}
   state.finalBodyUsed=reply.bodyUsed;
   if(options.twice)try{await reply.json()}catch(error){state.secondError=(error as Error).name}
 }).catch(error=>{
   state.error={name:error.name,message:error.message,status:error.status,code:error.code,requestId:error.requestId,outcome:error.outcome,
     queryHttp:error instanceof QueryHttpError,transient:isTransientReadFailure(error)};
 }).finally(()=>{state.settled=true});
};
