import {registerReadFreshness} from '../src/shared/query/readFreshness';
const state={calls:[] as string[],finished:[] as string[],aborted:[] as string[],ready:true,held:false};
const releases=new Map<string,()=>void>(),stops=new Map<string,()=>void>();
const register=(id:string,key:string)=>{stops.set(id,registerReadFreshness(key,{interval:60_000,ready:()=>state.ready,refresh:async signal=>{state.calls.push(id);signal.addEventListener('abort',()=>state.aborted.push(id),{once:true});if(state.held)await new Promise<void>(resolve=>releases.set(id,resolve));state.finished.push(id);}}));};
Object.assign(window,{probe:{state,register,stop:(id:string)=>stops.get(id)?.(),release:(id:string)=>releases.get(id)?.()}});document.getElementById('ready')!.textContent='Ready';
