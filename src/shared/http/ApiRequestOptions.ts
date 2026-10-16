// Transport-only options; safe in eager/shared services and role previews.
export interface ApiRequestOptions {signal?:AbortSignal;onUnauthorized?:()=>void;}
