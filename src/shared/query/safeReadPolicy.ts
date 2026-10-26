/** Opt-in only: GET is not proof that an endpoint is a pure read. */
export function isTransientReadFailure(error:unknown,depth=0):boolean {
 if(!(error instanceof Error)||error.name==='AbortError')return false;
 if('status' in error&&error.status!==undefined)return [408,429,500,502,503,504].includes(Number(error.status));
 if(depth<2&&'cause' in error&&isTransientReadFailure(error.cause,depth+1))return true;
 return error instanceof TypeError||error.name==='TimeoutError';
}
export const safeReadOptions={
 retry:(failureCount:number,error:Error)=>failureCount<1&&isTransientReadFailure(error),
 retryDelay:1_000,refetchOnReconnect:true,meta:{pureRead:true},
};
