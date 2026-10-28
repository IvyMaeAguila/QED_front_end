import {useLayoutEffect,useRef} from 'react';

type Reader = {refresh:(signal:AbortSignal)=>Promise<unknown>;ready:()=>boolean;interval:number};
type Owner = {readers:Set<Reader>;lastAttempt:number;flight:Promise<unknown>|null;controller:AbortController|null;timer:number;check:()=>void};
const owners=new Map<string,Owner>();
/** One foreground read cycle per full session/resource owner. Never owns writes. */
export function registerReadFreshness(key:string,reader:Reader){
 let owner=owners.get(key);
 if(!owner){
  const current:Owner={readers:new Set(),lastAttempt:Date.now(),flight:null,controller:null,timer:0,check:()=>{}};
  current.check=()=>{
   if(current.flight||document.visibilityState!=='visible'||!navigator.onLine)return;
   const available=[...current.readers].filter(r=>r.ready());
   const interval=Math.min(...available.map(r=>r.interval));
   if(!available.length||Date.now()-current.lastAttempt<interval)return;
   current.lastAttempt=Date.now();const controller=new AbortController();current.controller=controller;
   current.flight=Promise.resolve().then(()=>{if(!controller.signal.aborted)return available.at(-1)!.refresh(controller.signal);}).finally(()=>{current.flight=null;current.controller=null;});
  };
  window.addEventListener('focus',current.check);window.addEventListener('online',current.check);document.addEventListener('visibilitychange',current.check);
  owners.set(key,current);owner=current;
 }
 owner.readers.add(reader);
 const schedule=()=>{window.clearInterval(owner!.timer);owner!.timer=window.setInterval(owner!.check,Math.min(...[...owner!.readers].map(r=>r.interval)));};schedule();
 return()=>{owner!.readers.delete(reader);if(owner!.readers.size){schedule();return;}window.clearInterval(owner!.timer);owner!.controller?.abort();window.removeEventListener('focus',owner!.check);window.removeEventListener('online',owner!.check);document.removeEventListener('visibilitychange',owner!.check);if(owners.get(key)===owner)owners.delete(key);};
}
export function useReadFreshness(key:string,enabled:boolean,refresh:Reader['refresh'],ready:()=>boolean=()=>true,interval=60_000){
 const current=useRef({refresh,ready});useLayoutEffect(()=>{current.current={refresh,ready};});
 useLayoutEffect(()=>{if(!enabled)return;return registerReadFreshness(key,{refresh:signal=>current.current.refresh(signal),ready:()=>current.current.ready(),interval});},[key,enabled,interval]);
}
