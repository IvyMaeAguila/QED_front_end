import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {MoreHorizontal,Eye,UserRoundX,Undo2} from 'lucide-react';
type Props={name:string;dropped:boolean;disabled:boolean;darkMode:boolean;onView:()=>void;onDropout:()=>void};
export function AttendanceRowMenu({name,dropped,disabled,darkMode,onView,onDropout}:Props){
 const [position,setPosition]=useState<{top:number;left:number}|null>(null);const button=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null);
 const close=()=>{setPosition(null);button.current?.focus();};
 useEffect(()=>{
 if(!position)return;
 menu.current?.querySelector<HTMLButtonElement>('button')?.focus();
 const outside=(e:PointerEvent)=>{if(!menu.current?.contains(e.target as Node)&&!button.current?.contains(e.target as Node))setPosition(null);};
 const dismiss=()=>setPosition(null);
 document.addEventListener('pointerdown',outside);window.addEventListener('resize',dismiss);window.addEventListener('scroll',dismiss,true);
 return()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',dismiss);window.removeEventListener('scroll',dismiss,true);};
 },[position]);
 const item='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold focus:outline-none '+(darkMode?'hover:bg-white/10 focus:bg-white/10':'hover:bg-brand-light focus:bg-brand-light');
 return <><button ref={button} type="button" aria-label={'Actions for '+name} aria-haspopup="menu" aria-expanded={!!position} disabled={disabled} onClick={()=>{if(position){close();return;}const rect=button.current!.getBoundingClientRect();setPosition({left:Math.max(8,Math.min(rect.right-248,window.innerWidth-256)),top:rect.bottom+150>window.innerHeight?Math.max(8,rect.top-138):rect.bottom+6});}} className={'inline-flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-40 '+(darkMode?'border-white/10 hover:bg-white/5':'border-black/10 hover:bg-brand-light')}><MoreHorizontal size={16}/></button>
 {position&&createPortal(<div ref={menu} role="menu" aria-label={'Attendance actions for '+name} className={'fixed z-[10001] w-62 rounded-xl border p-1.5 shadow-lg '+(darkMode?'border-white/10 bg-panel-dark text-white':'border-black/10 bg-white text-slate-900')} style={position} onKeyDown={e=>{const items=Array.from(menu.current!.querySelectorAll('button'));if(e.key==='Escape'||e.key==='Tab'){if(e.key==='Escape')e.preventDefault();close();}if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const index=items.indexOf(document.activeElement as HTMLButtonElement);items[e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}}}>
 <p className={'truncate px-3 py-2 text-xs '+(darkMode?'text-slate-400':'text-slate-500')}>{name}</p>
 <button role="menuitem" type="button" className={item} onClick={()=>{close();onView();}}><Eye size={15} strokeWidth={1.75}/>View attendance summary</button>
 <div className={'my-1 border-t '+(darkMode?'border-white/10':'border-black/10')}/>
 <button role="menuitem" type="button" className={item} style={{color:'var(--brand-ink)'}} onClick={()=>{close();onDropout();}}>{dropped?<Undo2 size={15}/>:<UserRoundX size={15}/>} {dropped?'Reverse dropout declaration':'Declare dropout'}</button>
 </div>,document.body)}</>;
}
