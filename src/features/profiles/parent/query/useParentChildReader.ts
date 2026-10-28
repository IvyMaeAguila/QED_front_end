import {freshChildResource,useParentFreshness} from './useParentFreshness';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { useParentReader } from './useParentReader';
import { useParentYear } from './useParentYear';
import {useCallback} from 'react';

export function useParentChildReader<T>(resource: readonly unknown[], studentId: string | number | undefined, fetcher: (options: ApiRequestOptions) => Promise<T>, message: string, staleTime = 30_000, refreshInterval?: number, enabled = true) {
  const coordinated=freshChildResource(resource);
  useParentFreshness(studentId,enabled&&coordinated);
  const year = useParentYear(enabled);
  const ready = enabled && !!studentId && year.data !== undefined && !year.loading;
  const reader = useParentReader(['student', String(studentId ?? ''), 'year', year.data?.id ?? null, ...resource], fetcher, message, ready, undefined, staleTime, refreshInterval,coordinated?{reconnect:false}:undefined);
  const {error:yearError,retry:retryYear}=year,{retry:retryReader}=reader;
  const retry=useCallback(async()=>{if(yearError)await retryYear();else await retryReader();},[yearError,retryYear,retryReader]);
  return {
    ...reader,
    data: ready ? reader.data : undefined,
    loading: enabled && (year.loading || (ready && reader.loading)),
    error: enabled ? year.error ?? reader.error : null,
    retry,
    yearId: year.data?.id ?? null,
    denied: year.denied || reader.denied,
  };
}
