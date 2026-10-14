import { useSyncExternalStore } from 'react';
const subscribe=(notify:()=>void)=>{window.addEventListener('online',notify);window.addEventListener('offline',notify);return()=>{window.removeEventListener('online',notify);window.removeEventListener('offline',notify);};};
export function ParentConnectionNotice({darkMode}:{darkMode:boolean}) {
  const online=useSyncExternalStore(subscribe,()=>navigator.onLine);
  return online?null:<div role="alert" className={`mb-4 rounded-xl border p-4 ${darkMode?'border-border-dark bg-panel-dark text-white':'border-border-subtle bg-white text-[#111827]'}`}>You're offline. Previously loaded records remain available where cached. Reconnect and try again.</div>;
}
