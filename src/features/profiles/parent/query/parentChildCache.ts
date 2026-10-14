import {queryClient} from '@shared/query/queryClient';
import {QueryHttpError} from '@shared/http/QueryHttpError';
// Permission evidence lives in the existing Query states, not a second cache.
// Do not cancel peers here: a pending401 must still expire its own session.
export function childDenial(prefix:readonly unknown[]) {
  return queryClient.getQueryCache().findAll({queryKey:prefix}).filter(query=>query.state.error instanceof Error&&'status'in query.state.error&&Number(query.state.error.status)===403)
    .sort((a,b)=>b.state.errorUpdatedAt-a.state.errorUpdatedAt)[0]?.state.error;
}
export function hideChildCache(prefix:readonly unknown[],error:Error) {
  const denied='status'in error&&Number(error.status)===403?error:new QueryHttpError(error.message,403);
  for(const query of queryClient.getQueryCache().findAll({queryKey:prefix})) {
    if(query.state.error===denied&&query.state.data===undefined)continue;
    query.setState({data:undefined,error:denied,status:'error',errorUpdatedAt:Date.now()});
  }
}
