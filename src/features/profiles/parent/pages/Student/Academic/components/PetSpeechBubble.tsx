import { useEffect, useRef, useState } from "react";
import { Apple, ArrowRight, CheckCircle2, Flag, Lightbulb, Sparkles, Star } from "lucide-react";
import { CHOICE_COLORS, type Choice } from "./QuizShared";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useTypewriter(text: string, startDelayMs: number) {
  const [count, setCount] = useState(0);
  const timers = useRef<{
    start?: ReturnType<typeof setTimeout>;
    tick?: ReturnType<typeof setInterval>;
  }>({});

  useEffect(() => {
    if (prefersReducedMotion() || text.length === 0) {
      setCount(text.length);
      return;
    }
    setCount(0);
    const step = Math.max(8, Math.min(28, Math.floor(1800 / text.length)));
    timers.current.start = setTimeout(() => {
      let i = 0;
      timers.current.tick = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length) clearInterval(timers.current.tick);
      }, step);
    }, startDelayMs);
    return () => {
      clearTimeout(timers.current.start);
      clearInterval(timers.current.tick);
    };
  }, [text, startDelayMs]);

  return {
    shown: text.slice(0, count),
    skip: () => {
      clearTimeout(timers.current.start);
      clearInterval(timers.current.tick);
      setCount(text.length);
    },
  };
}

export default function PetSpeechBubble({
  message,
  isCorrect,
  correctChoice,
  correctText,
  explanation,
  isLast,
  onNext,
}: {
  message: string;
  isCorrect: boolean;
  correctChoice: Choice;
  correctText: string;
  explanation: string;
  isLast: boolean;
  onNext: () => void;
}) {
  const { shown, skip } = useTypewriter(explanation, 700);

  const theme = isCorrect
    ? {
        border: "border-emerald-300",
        shadow: "shadow-[0_5px_0_0_#a7f3d0,0_14px_24px_-10px_rgba(16,185,129,0.45)]",
        head: "text-emerald-600",
      }
    : {
        border: "border-amber-300",
        shadow: "shadow-[0_5px_0_0_#fde68a,0_14px_24px_-10px_rgba(245,158,11,0.45)]",
        head: "text-amber-600",
      };

  return (
    <div className={`pb-root relative mt-2 w-full max-w-sm ${isCorrect ? "pb-pop-correct" : "pb-pop-wrong"}`}>
      <div className={`pb-float relative rounded-3xl border-[3px] bg-white p-4 text-left ${theme.border} ${theme.shadow}`}>
        <div className="absolute -top-2.75 left-1/2 -translate-x-1/2" aria-hidden="true">
          <div className={`pb-tail h-4 w-4 border-l-[3px] border-t-[3px] bg-white ${theme.border}`} />
        </div>

        {isCorrect && (
          <>
            <Sparkles
              size={20}
              aria-hidden="true"
              className="pb-twinkle pointer-events-none absolute -right-2 -top-3 text-amber-400"
              style={{ animationDelay: "0.2s" }}
            />
            <Star
              size={14}
              aria-hidden="true"
              className="pb-twinkle pointer-events-none absolute -left-2 top-7 fill-amber-300 text-amber-300"
              style={{ animationDelay: "0.6s" }}
            />
            <Sparkles
              size={14}
              aria-hidden="true"
              className="pb-twinkle pointer-events-none absolute -bottom-1 -right-3 text-sky-400"
              style={{ animationDelay: "1s" }}
            />
          </>
        )}

        <p
          className={`pb-rise flex items-center gap-2 text-base font-extrabold ${theme.head}`}
          style={{ animationDelay: "0.15s" }}
        >
          {isCorrect ? <CheckCircle2 size={20} /> : <Lightbulb size={20} className="pb-swing" />}
          {message}
        </p>

        <div className="pb-rise mt-2.5" style={{ animationDelay: "0.35s" }}>
          <p className="text-xs font-semibold text-gray-500">The answer is</p>
          <div
            className="pb-chip mt-1 flex items-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-2.5 py-2"
            style={{ animationDelay: "0.45s" }}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${CHOICE_COLORS[correctChoice].badge}`}
            >
              {correctChoice}
            </span>
            <span className="text-sm font-bold text-gray-800">{correctText}</span>
          </div>
        </div>

        {explanation && (
          <p className="relative mt-2.5 cursor-pointer text-sm leading-snug text-gray-600" onClick={skip}>
            <span className="sr-only">{explanation}</span>
            <span aria-hidden="true" className="invisible">
              {explanation}
            </span>
            <span aria-hidden="true" className="absolute inset-0">
              {shown}
            </span>
          </p>
        )}

        {isCorrect && (
          <p
            className="pb-chip mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600"
            style={{ animationDelay: "1s" }}
          >
            <Apple size={14} className="pb-swing fill-rose-500" style={{ animationDelay: "1.3s" }} />
            Yum! Energy meter +1
          </p>
        )}

        <button
          onClick={onNext}
          className="pb-cta mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-rose-800 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_0_#881337] hover:bg-rose-900 active:shadow-none active:brightness-90"
        >
          {isLast ? (
            <>
              <Flag size={16} />
              See Round Results
            </>
          ) : (
            <>
              Next Question
              <ArrowRight size={16} className="pb-arrow" />
            </>
          )}
        </button>
      </div>

      <style>{`
        .pb-pop-correct { transform-origin: 50% 0; animation: pbPopCorrect 0.55s cubic-bezier(.34,1.56,.64,1) backwards; }
        .pb-pop-wrong   { transform-origin: 50% 0; animation: pbPopWrong 0.7s ease-out backwards; }
        .pb-float       { animation: pbFloat 3.4s ease-in-out 0.8s infinite; }
        .pb-tail        { animation: pbTail 1.8s ease-in-out infinite; }
        .pb-rise        { animation: pbRise 0.4s ease-out backwards; }
        .pb-chip        { animation: pbChip 0.5s cubic-bezier(.34,1.56,.64,1) backwards; }
        .pb-twinkle     { animation: pbTwinkle 1.4s ease-in-out infinite; }
        .pb-swing       { animation: pbSwing 0.7s ease-in-out 0.9s 2; }
        .pb-cta         { animation: pbRise 0.4s ease-out 1.1s backwards, pbNudge 1.8s ease-in-out 2.2s infinite; }
        .pb-arrow       { animation: pbArrow 1s ease-in-out infinite; }

        @keyframes pbPopCorrect {
          0%   { opacity: 0; transform: translateY(-16px) scale(0.6) rotate(-3deg); }
          60%  { opacity: 1; transform: translateY(2px) scale(1.06) rotate(1deg); }
          100% { opacity: 1; transform: none; }
        }
        @keyframes pbPopWrong {
          0%   { opacity: 0; transform: translateY(-10px) scale(0.85); }
          40%  { opacity: 1; transform: translateY(0) scale(1.02); }
          55%  { transform: rotate(-1.5deg); }
          70%  { transform: rotate(1.2deg); }
          85%  { transform: rotate(-0.6deg); }
          100% { opacity: 1; transform: none; }
        }
        @keyframes pbFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-2px); }
        }
        @keyframes pbTail {
          0%, 100% { transform: rotate(45deg); }
          50%      { transform: rotate(45deg) translate(-2px, -2px); }
        }
        @keyframes pbRise {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: none; }
        }
        @keyframes pbChip {
          0%   { opacity: 0; transform: scale(0.4); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pbTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.6) rotate(0deg); }
          50%      { opacity: 1;   transform: scale(1.1) rotate(20deg); }
        }
        @keyframes pbSwing {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(-14deg); }
          75%      { transform: rotate(14deg); }
        }
        @keyframes pbNudge {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.03); }
        }
        @keyframes pbArrow {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(3px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pb-root, .pb-root * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}