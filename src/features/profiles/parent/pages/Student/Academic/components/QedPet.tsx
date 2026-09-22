import { useEffect, useRef, useState } from "react";
import petIdle from "./assets/pet-idle.png";
import petHungry from "./assets/pet-hungry.png";
import petHappy from "./assets/pet-happy.png";

export type PetState =
  | "idle"
  | "thinking"
  | "hungry"
  | "wrong"
  | "correct"
  | "eating"
  | "happy"
  | "levelup";

interface QedPetProps {
  state: PetState;
  onSettled?: (nextState: PetState) => void;
  className?: string;
}

const FRAME: Record<PetState, "idle" | "hungry" | "happy"> = {
  idle: "idle",
  thinking: "idle",
  hungry: "hungry",
  wrong: "hungry",
  correct: "happy",
  happy: "happy",
  levelup: "happy",
  eating: "hungry",
};

const SETTLE_AFTER: Partial<Record<PetState, { next: PetState; ms: number }>> = {
  wrong: { next: "hungry", ms: 650 },
  correct: { next: "happy", ms: 900 },
  levelup: { next: "happy", ms: 950 },
  eating: { next: "happy", ms: 2000 },
};

const EAT_SWAP_MS = 900;

const ANIM_CONFIG: Record<string, { duration: number; iterationCount: "infinite" | 1 }> = {
  breathe: { duration: 3000, iterationCount: "infinite" },
  think: { duration: 1200, iterationCount: "infinite" },
  hungryBob: { duration: 1600, iterationCount: "infinite" },
  wrongShake: { duration: 650, iterationCount: 1 },
  correctJumpSpin: { duration: 900, iterationCount: 1 },
  happyLoop: { duration: 1600, iterationCount: "infinite" },
  levelJump: { duration: 950, iterationCount: 1 },
  eatDip: { duration: 1100, iterationCount: "infinite" },
};

export default function QedPet({ state, onSettled, className = "" }: QedPetProps) {
  const [eatPhase, setEatPhase] = useState<"pre" | "post">("pre");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const swapRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timerRef.current);
    clearTimeout(swapRef.current);
    setEatPhase("pre");

    if (state === "eating") {
      swapRef.current = setTimeout(() => setEatPhase("post"), EAT_SWAP_MS);
    }

    const settle = SETTLE_AFTER[state];
    if (settle && onSettled) {
      timerRef.current = setTimeout(() => onSettled(settle.next), settle.ms);
    }

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(swapRef.current);
    };
  }, [state, onSettled]);

  const frame = state === "eating" && eatPhase === "post" ? "happy" : FRAME[state];

  const handleClick = () => {
    if (state === "idle" && onSettled) onSettled("happy");
  };

  return (
    <div
      className={`relative w-75 h-75 flex items-end justify-center overflow-hidden rounded-[2.5rem] ${
        state === "idle" ? "cursor-pointer" : ""
      } ${className}`}
      onClick={handleClick}
      style={{
        background: "linear-gradient(to bottom, #bfe3ff 0%, #d9f0ff 45%, #eaf9e8 55%, #eaf9e8 100%)",
      }}
    >
      <div
        className="absolute top-4 right-6 w-14 h-14 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #fff3b0 0%, rgba(255,243,176,0) 70%)" }}
      />
      <div
        className="absolute top-8 left-8 w-16 h-8 rounded-full bg-white/70 blur-[2px] pointer-events-none"
      />
      <div
        className="absolute top-16 left-16 w-10 h-5 rounded-full bg-white/60 blur-[1px] pointer-events-none"
      />
      <div
        className="absolute top-10 right-16 w-12 h-6 rounded-full bg-white/60 blur-[1px] pointer-events-none"
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, #d7f2c9 0%, #b9e8a4 100%)",
          borderTopLeftRadius: "60% 100%",
          borderTopRightRadius: "60% 100%",
        }}
      />
      <div
        className="absolute bottom-2 left-10 w-3 h-3 rounded-full bg-emerald-600/40 pointer-events-none"
      />
      <div
        className="absolute bottom-3 right-14 w-2.5 h-2.5 rounded-full bg-emerald-600/40 pointer-events-none"
      />
      <div
        className="absolute bottom-1 right-24 w-2 h-2 rounded-full bg-emerald-600/30 pointer-events-none"
      />
      {/* --- end backdrop --- */}

      <div
        className="absolute bottom-3 w-45 h-5.5 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.16), transparent 70%)",
          animation: shadowAnimFor(state),
        }}
      />

      <PetFrame src={petIdle} show={frame === "idle"} anim={state === "thinking" ? "think" : "breathe"} />
      <PetFrame
        src={petHungry}
        show={frame === "hungry"}
        anim={state === "wrong" ? "wrongShake" : state === "eating" ? "eatDip" : "hungryBob"}
      />
      <PetFrame
        src={petHappy}
        show={frame === "happy"}
        anim={
          state === "correct"
            ? "correctJumpSpin"
            : state === "levelup"
            ? "levelJump"
            : state === "eating" && eatPhase === "post"
            ? "eatDip"
            : "happyLoop"
        }
      />

      {state === "eating" && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ animation: "foodIn 2s ease-in-out 1" }}
        >
          <div className="w-9 h-9 rounded-full bg-rose-500 shadow-md" />
        </div>
      )}

      {state === "correct" && (
        <div
          className="absolute top-[8%] right-[10%] w-13.5 h-13.5 rounded-full bg-emerald-600 flex items-center justify-center pointer-events-none shadow-lg"
          style={{ animation: "checkPop 0.85s cubic-bezier(.34,1.56,.64,1) 1" }}
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {state === "levelup" &&
        SPARKLE_POS.map((pos, i) => (
          <span
            key={i}
            className="absolute w-3.5 h-3.5 pointer-events-none"
            style={{ ...pos, animation: `sparklePop 0.9s ease-out ${i * 0.06}s 1` }}
          >
            <span className="absolute inset-x-0 top-1/2 h-0.625 -translate-y-1/2 bg-amber-400" />
            <span className="absolute inset-y-0 left-1/2 w-0.625 -translate-x-1/2 bg-amber-400" />
          </span>
        ))}

      <PetKeyframes />
    </div>
  );
}

function PetFrame({ src, show, anim }: { src: string; show: boolean; anim: string }) {
  const config = ANIM_CONFIG[anim] ?? { duration: 3000, iterationCount: "infinite" as const };
  return (
    <img
      src={src}
      alt=""
      className="absolute bottom-4 w-70 h-auto transition-opacity duration-150"
      style={{
        opacity: show ? 1 : 0,
        animation: show ? `${anim} ${config.duration}ms ease-in-out ${config.iterationCount}` : "none",
      }}
    />
  );
}

function shadowAnimFor(state: PetState) {
  if (state === "correct" || state === "levelup") return "correctShadow 0.8s ease 1";
  if (state === "happy") return "happyShadowLoop 1.6s ease-in-out infinite";
  if (state === "idle" || state === "thinking" || state === "hungry")
    return "breatheShadow 3s ease-in-out infinite";
  return "none";
}

const SPARKLE_POS = [
  { top: "26%", left: "14%" },
  { top: "16%", right: "12%" },
  { top: "46%", left: "6%" },
  { top: "10%", left: "44%" },
  { top: "48%", right: "8%" },
];

function PetKeyframes() {
  return (
    <style>{`
      @keyframes breathe { 0%,100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-3px) scaleY(1.015); } }
      @keyframes breatheShadow { 0%,100% { transform: scale(1); } 50% { transform: scale(0.96); } }
      @keyframes think { 0%,100% { transform: translateY(0) rotate(0deg); } 30% { transform: translateY(-4px) rotate(-3deg); } 60% { transform: translateY(-2px) rotate(2deg); } }
      @keyframes hungryBob { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(4px) rotate(-2deg); } }
      @keyframes wrongShake { 0% { transform: translateX(0) rotate(0deg); } 15% { transform: translateX(-6px) rotate(-3deg); } 30% { transform: translateX(5px) rotate(3deg); } 45% { transform: translateX(-3px) rotate(-1.5deg); } 60% { transform: translateX(2px) rotate(1deg); } 100% { transform: translateX(0) rotate(0deg); } }
      @keyframes correctJumpSpin { 0% { transform: translateY(0) rotate(0deg) scale(1); } 20% { transform: translateY(-30px) rotate(120deg) scale(1.05,0.96); } 50% { transform: translateY(-38px) rotate(230deg) scale(1); } 75% { transform: translateY(-10px) rotate(340deg) scale(1.02,0.98); } 100% { transform: translateY(0) rotate(360deg) scale(1); } }
      @keyframes correctShadow { 0% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(0.55); opacity: 0.2; } 100% { transform: scale(1); opacity: 0.5; } }
      @keyframes checkPop { 0%,15% { opacity:0; transform: scale(0.3) rotate(-20deg); } 45% { opacity:1; transform: scale(1.15) rotate(6deg); } 60% { transform: scale(1) rotate(0deg); } 85% { opacity:1; transform: scale(1) rotate(0deg); } 100% { opacity:0; transform: scale(0.85) rotate(0deg); } }
      @keyframes happyLoop { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      @keyframes happyShadowLoop { 0%,100% { transform: scale(1); } 50% { transform: scale(0.9); } }
      @keyframes levelJump { 0% { transform: translateY(0) scale(1); } 30% { transform: translateY(-42px) scale(1.06,0.95); } 50% { transform: translateY(-42px) scale(1); } 70% { transform: translateY(0) scale(0.96,1.05); } 100% { transform: translateY(0) scale(1); } }
      @keyframes sparklePop { 0% { opacity:0; transform: scale(0.2) rotate(0deg);} 40% { opacity:1; transform: scale(1.1) rotate(90deg);} 100% { opacity:0; transform: scale(0.4) rotate(180deg) translateY(-14px);} }
      @keyframes eatDip { 0%,15% { transform: translateY(0) rotate(0deg); } 35% { transform: translateY(6px) rotate(-4deg); } 55% { transform: translateY(4px) rotate(3deg); } 70% { transform: translateY(6px) rotate(-2deg); } 85% { transform: translateY(-6px) rotate(0deg) scale(1.03); } 100% { transform: translateY(0) rotate(0deg) scale(1); } }
      @keyframes foodIn { 0% { transform: translate(-50%,40px) scale(0.6); opacity:0; } 18% { transform: translate(-50%,0) scale(1); opacity:1; } 70% { transform: translate(-50%,0) scale(1); opacity:1; } 85% { transform: translate(-50%,-4px) scale(0.7); opacity:0.6; } 100% { transform: translate(-50%,-4px) scale(0.3); opacity:0; } }
      @media (prefers-reduced-motion: reduce) {
        * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
      }
    `}</style>
  );
}