import { useRef } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";

export type PetState = "idle" | "thinking" | "hungry" | "wrong" | "correct" | "eating" | "happy" | "levelup";
interface Props { state: PetState; onSettled?: (next: PetState) => void; className?: string }
const SETTLE: Partial<Record<PetState, {next: PetState; ms: number}>> = {
  wrong: {next:"hungry",ms:650}, correct:{next:"happy",ms:900},
  levelup:{next:"happy",ms:950}, eating:{next:"happy",ms:2000},
};
/** The same Ed in the story, quiz, loading and celebration. State callbacks retain the existing feeding flow. */
export default function QedPet({state,onSettled,className=""}:Props) {
  const settled = useRef(onSettled); settled.current=onSettled;
  useEffect(()=>{const transition=SETTLE[state];if(!transition)return;const timer=setTimeout(()=>settled.current?.(transition.next),transition.ms);return()=>clearTimeout(timer);},[state]);
  const happy=["happy","correct","eating","levelup"].includes(state);
  const worried=state==="wrong";
  const hungry=state==="hungry";
  return <div className={`ed-mascot ed-${state} ${className}`} role="img" aria-label={`Ed, ${happy?"happy":worried?"encouraging":state}`}>
    <svg viewBox="0 0 240 255" aria-hidden="true" focusable="false">
      <ellipse cx="120" cy="243" rx="77" ry="7" fill="#294b3b" opacity=".15"/>
      <g className="ed-body">
        <ellipse cx="88" cy="231" rx="24" ry="10" fill="#8a0c12"/><ellipse cx="151" cy="231" rx="24" ry="10" fill="#8a0c12"/>
        <ellipse cx="33" cy="177" rx="15" ry="19" fill="#8a0c12" transform="rotate(18 33 177)"/><ellipse cx="207" cy="177" rx="15" ry="19" fill="#8a0c12" transform="rotate(-18 207 177)"/>
        <path d="M120 57C67 57 31 101 31 162c0 48 32 73 89 73s89-25 89-73c0-61-36-105-89-105Z" fill="#c9212d"/>
        <ellipse cx="120" cy="205" rx="54" ry="27" fill="#df4650" opacity=".8"/>
        <ellipse cx="77" cy="87" rx="25" ry="11" transform="rotate(-35 77 87)" fill="#fff" opacity=".43"/><circle cx="50" cy="110" r="5" fill="#fff" opacity=".43"/>
        <path d="M120 59q-7-21-1-32" fill="none" stroke="#429a59" strokeWidth="6" strokeLinecap="round"/>
        <path d="M120 34q-19-24-33-8 15 17 33 8Z" fill="#7bd68f"/><path d="M119 34q19-25 34-9-15 18-34 9Z" fill="#5bbf74"/>
        <g className={happy?"":"ed-eyes"}>
          {happy?<g fill="none" stroke="#2a0a10" strokeWidth="9" strokeLinecap="round"><path d="M67 156q16-24 32 0"/><path d="M143 156q16-24 32 0"/></g>:<g>
            <ellipse cx="83" cy="151" rx="18" ry="23" fill="#2a0a10"/><ellipse cx="157" cy="151" rx="18" ry="23" fill="#2a0a10"/>
            <circle cx="90" cy="140" r="8" fill="white"/><circle cx="164" cy="140" r="8" fill="white"/><circle cx="75" cy="163" r="4" fill="white"/><circle cx="149" cy="163" r="4" fill="white"/>
          </g>}
        </g>
        <ellipse cx="48" cy="181" rx="17" ry="10" fill="#ff8fa0" opacity=".85"/><ellipse cx="192" cy="181" rx="17" ry="10" fill="#ff8fa0" opacity=".85"/>
        {happy?<g><path d="M105 180h30q-15 30-30 0" fill="#530e20"/><ellipse cx="120" cy="192" rx="8" ry="4" fill="#ff8fa0"/></g>:worried?<g fill="none" stroke="#530e20" strokeWidth="4" strokeLinecap="round"><path d="m70 121 23-6m54 0 23 6M107 196q7-8 13-2t13-2"/></g>:hungry?<g><ellipse cx="120" cy="185" rx="10" ry="12" fill="#530e20"/><ellipse cx="122" cy="190" rx="5" ry="4" fill="#ff8fa0"/><path d="M137 188q-9 16 0 16t0-16" fill="#88d7fa"/></g>:<path d="M107 187q7 13 13 0 7 13 13 0" fill="none" stroke="#530e20" strokeWidth="4" strokeLinecap="round"/>}
        {worried&&<path d="M179 165q-11 20 0 20t0-20" fill="#88d7fa"/>}
        {happy&&<g className="ed-sparkles"><path d="m197 78 5 12 12 5-12 5-5 12-5-12-12-5 12-5ZM36 106l4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" fill="#ffcf49"/><path d="M211 132c-10-12-19 0 0 13 19-13 10-25 0-13Z" fill="#ff75a4"/></g>}
      </g>
    </svg>
  </div>;
}
