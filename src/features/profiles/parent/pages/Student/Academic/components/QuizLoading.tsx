import type { Difficulty } from "../service/petQuiz.service";
import petIdle from "./assets/pet-idle.png";

export default function QuizLoading({ difficulty }: { difficulty?: Difficulty }) {
  const label = difficulty ? `Getting your ${difficulty} quiz ready` : "Getting things ready";

  return (
    <div role="status" aria-live="polite" className="ql-root flex flex-col items-center py-6">
      <span className="sr-only">{label}</span>

      {/* the pet picture, squashing and stretching as it jumps */}
      <div className="flex h-44 items-end">
        <img
          src={petIdle}
          alt=""
          draggable={false}
          className="ql-bounce h-auto w-32 select-none"
        />
      </div>

      {/* shadow that shrinks as the pet jumps */}
      <div className="ql-shadow mt-1 h-2 w-16 rounded-full bg-black/15" aria-hidden="true" />

      {/* three bouncing dots */}
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="ql-dot h-2.5 w-2.5 rounded-full bg-rose-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <style>{`
        @keyframes qlBounce {
          0%, 100% { transform: translateY(0) scale(1.08, 0.92); }
          50%      { transform: translateY(-34px) scale(0.95, 1.05); }
        }
        .ql-bounce { transform-origin: 50% 100%; animation: qlBounce 0.9s ease-in-out infinite; }

        @keyframes qlShadow {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%      { transform: scale(0.6); opacity: 0.5; }
        }
        .ql-shadow { animation: qlShadow 0.9s ease-in-out infinite; }

        @keyframes qlDot {
          0%, 60%, 100% { transform: translateY(0); }
          30%           { transform: translateY(-6px); }
        }
        .ql-dot { animation: qlDot 1s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .ql-root * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
// Loading: the pet picture jumping, a little shadow, and bouncing dots.
// Shown while a level's quiz is being prepared (and while the page first loads).