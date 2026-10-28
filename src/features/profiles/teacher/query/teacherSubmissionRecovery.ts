import {QueryHttpError} from '@shared/http/QueryHttpError';
// A route remount must not replay an academic write with an unknown outcome.
// Full reload clears this fence and rereads authoritative status/history.
const fences=new Map<string,QueryHttpError>();
const inFlight=new Set<string>();
export async function confirmedSubmission(key:string,prepare:()=>Promise<string|null>,send:(version:string|null)=>Promise<void>,reconcile:()=>void){
 const fenced=fences.get(key);if(fenced)throw fenced;
 if(inFlight.has(key))throw new Error('A grade submission is already in progress.');
 inFlight.add(key);let sent=false;
 try{
  const version=await prepare();
  sent=true;await send(version);
 }catch(error){
  if(sent&&(!(error instanceof QueryHttpError)||error.outcome==='uncertain'||error.outcome==='conflict'||(error.status>=500&&error.outcome!=='not_saved'))){
   const failure=new QueryHttpError(error instanceof QueryHttpError&&error.outcome==='conflict'?error.message:'Grade submission could not be confirmed. Reload this class to check submission status and history before submitting again.',error instanceof QueryHttpError?error.status:503,error instanceof QueryHttpError&&error.outcome==='conflict'?'conflict':'uncertain');
   fences.set(key,failure);reconcile();throw failure;
  }
  throw error;
 }finally{inFlight.delete(key);}
}
