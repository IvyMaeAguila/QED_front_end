import { useLayoutEffect } from 'react';
import { useRoutePreview } from '@shared/loading/RoutePreview';
import { useUsers } from '../context/UsersContext';
/** Actual lazy pages activate reads; preview compositions never call this. */
export function useUserQueries() {
  const context = useUsers(), preview = useRoutePreview();
  const { activateQueries } = context;
  useLayoutEffect(() => { if (!preview) activateQueries(); }, [preview, activateQueries]);
  return context;
}
