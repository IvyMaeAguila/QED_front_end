import type { ReactNode } from "react";
import { CheckCircle2, Rocket, Sparkles, Star, Trophy, X, Zap } from "lucide-react";
import type { Difficulty } from "../service/petQuiz.service";
import { HungerMeter } from "./QuizWidgets";
import { DIFFICULTY_ORDER } from "./QuizShared";

// ---------- shared bits ----------
const PRIMARY_BTN =
  "w-full rounded-2xl bg-gradient-to-b from-rose-500 to-rose-700 px-4 py-3.5 text-base font-black text-white " +
  "shadow-[0_5px_0_0_#881337] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_0_#881337] " +
  "disabled:cursor-not-allowed disabled:opacity-70";

const SECONDARY_BTN =
  "w-full rounded-2xl border-2 border-rose-100 bg-white px-4 py-3 text-sm font-extrabold text-rose-700 " +
  "transition-transform hover:bg-rose-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70";

/** The same "coin" look as the stops on the level road. */
function Coin({ face, edge, children }: { face: string; edge: string; children: ReactNode }) {
  return (
    <div className="qm-float relative" style={{ width: 88, height: 88 }}>
      <span className={`absolute inset-x-0 bottom-0 h-20 rounded-full ${edge}`} />
      <span
        className={`absolute inset-x-0 top-0 flex h-20 items-center justify-center rounded-full ring-[6px] ring-white/40 ${face}`}
      >
        {children}
      </span>
    </div>
  );
}

function ModalStyles() {
  return (
    <style>{`
      @keyframes qmPop {
        0%   { transform: scale(0.7); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes qmFloat {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-5px); }
      }
      @keyframes qmTwinkle {
        0%, 100% { opacity: 0.4; transform: scale(0.8) rotate(0deg); }
        50%      { opacity: 1; transform: scale(1.15) rotate(15deg); }
      }
      @keyframes qmStar {
        0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
        70%  { transform: scale(1.25) rotate(8deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      .qm-pop     { animation: qmPop 0.4s cubic-bezier(.34,1.56,.64,1); }
      .qm-float   { animation: qmFloat 1.4s ease-in-out infinite; }
      .qm-twinkle { animation: qmTwinkle 1.8s ease-in-out infinite; }
      .qm-star    { animation: qmStar 0.5s ease-out both; }
      @media (prefers-reduced-motion: reduce) {
        .qm-pop, .qm-float, .qm-twinkle, .qm-star { animation: none !important; }
      }
    `}</style>
  );
}

// -------------------- End Intervention confirmation --------------------
export function EndInterventionConfirm({
  onConfirm,
  onCancel,
  isEnding = false,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  /** True while the server call is running: disables the buttons. */
  isEnding?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-intervention-title"
        className="qm-pop relative w-full max-w-sm rounded-3xl bg-white px-5 pb-5 pt-14 text-center shadow-[0_6px_0_0_#fecdd3]"
      >
        {/* the coin sits half outside the top of the card */}
        <div className="absolute -top-11 left-1/2 -translate-x-1/2">
          <Coin face="bg-rose-400" edge="bg-rose-600">
            <Rocket size={38} className="text-white" />
          </Coin>
        </div>

        <p id="end-intervention-title" className="text-xl font-black text-rose-900">
          Send ED on his way?
        </p>

        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
          <Zap size={13} />
          ED is fully charged
        </span>

        <p className="mt-3 text-sm font-semibold text-gray-600">
          ED has enough energy now to continue his journey. Ending the intervention means this
          topic won't be flagged again unless new low grades come in.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <button type="button" onClick={onConfirm} disabled={isEnding} className={PRIMARY_BTN}>
            {isEnding ? "Ending…" : "Yes, end intervention"}
          </button>
          <button type="button" onClick={onCancel} disabled={isEnding} className={SECONDARY_BTN}>
            Not yet
          </button>
        </div>

        <ModalStyles />
      </div>
    </div>
  );
}

// -------------------- Final accomplishment modal --------------------
const CHECK_COLOR: Record<Difficulty, string> = {
  Easy: "text-emerald-500",
  Medium: "text-amber-500",
  Hard: "text-rose-500",
};

export function AccomplishmentModal({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="accomplishment-title"
        className="qm-pop relative w-full max-w-sm rounded-3xl bg-linear-to-b from-amber-200 to-amber-300 px-5 pb-6 pt-14 text-center shadow-[0_8px_0_0_#b45309] ring-4 ring-white/60"
      >
        <button
          type="button"
          onClick={onContinue}
          aria-label="Close"
          className="absolute -right-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white shadow-md ring-4 ring-white transition-transform active:scale-90"
        >
          <X size={18} strokeWidth={3} />
        </button>

        {/* little twinkles around the trophy */}
        <div className="pointer-events-none" aria-hidden="true">
          <Sparkles size={18} className="qm-twinkle absolute left-6 top-5 text-white" />
          <Sparkles
            size={14}
            className="qm-twinkle absolute right-8 top-9 text-white"
            style={{ animationDelay: "0.6s" }}
          />
          <Sparkles
            size={12}
            className="qm-twinkle absolute left-10 top-20 text-white"
            style={{ animationDelay: "1.1s" }}
          />
        </div>

        <div className="absolute -top-11 left-1/2 -translate-x-1/2">
          <Coin face="bg-amber-400" edge="bg-amber-600">
            <Trophy size={42} className="text-white drop-shadow" />
          </Coin>
        </div>

        <p id="accomplishment-title" className="text-3xl font-black text-amber-950">
          Well Done!
        </p>
        <p className="mt-1 text-sm font-bold text-amber-900">
          ED has enough energy to continue his journey!
        </p>

        <div className="mt-4 flex justify-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              size={40}
              className="qm-star fill-white text-amber-500 drop-shadow"
              style={{ animationDelay: `${(s - 1) * 0.15}s` }}
            />
          ))}
        </div>

        <div className="mt-4 flex justify-center gap-2 text-xs font-black text-amber-950">
          {DIFFICULTY_ORDER.map((d) => (
            <span key={d} className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 shadow-sm">
              <CheckCircle2 size={14} className={CHECK_COLOR[d]} />
              {d}
            </span>
          ))}
        </div>

        <div className="mt-4 flex justify-center">
          <HungerMeter filled={5} total={5} />
        </div>
        <p className="mt-1 text-xs font-extrabold text-amber-950">ED is fully energized!</p>

        <p className="mt-3 text-sm font-semibold text-amber-950">Great job learning this topic!</p>

        <button type="button" onClick={onContinue} className={`${PRIMARY_BTN} mt-5`}>
          Continue
        </button>

        <ModalStyles />
      </div>
    </div>
  );
}
// The two popups shown when the whole intervention is finished.
// Styled to match the level road: chunky rounded shapes, "coin" icons,
// rose / emerald / amber colours.