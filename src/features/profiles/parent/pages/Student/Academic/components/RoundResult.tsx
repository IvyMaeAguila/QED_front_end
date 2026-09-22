import { ArrowUpCircle, Flame, PauseCircle, RefreshCcw, Trophy } from "lucide-react";
import type { Difficulty } from "../service/petQuiz.service";
import { StarRating } from "./QuizWidgets";
import type { RoundMode } from "./QuizShared";

interface RoundResultProps {
  /** Score from the first (full) round. Only shown for full rounds. */
  firstRoundScore: { score: number; total: number } | null;
  roundMode: RoundMode;
  bestStreak: number;
  /** True when the level was fully cleared. */
  cleared: boolean;
  difficulty: Difficulty;
  /** The next level, or null if this was the last one. */
  nextDiff: Difficulty | null;
  onContinue: () => void;
  onPracticeMissed: () => void;
  onStop: () => void;
}

export default function RoundResult({
  firstRoundScore,
  roundMode,
  bestStreak,
  cleared,
  difficulty,
  nextDiff,
  onContinue,
  onPracticeMissed,
  onStop,
}: RoundResultProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center w-full max-w-sm">
      {firstRoundScore && roundMode === "full" && (
        <>
          <StarRating ratio={firstRoundScore.score / firstRoundScore.total} />
          <p className="font-extrabold text-2xl">
            {firstRoundScore.score} / {firstRoundScore.total}
          </p>
        </>
      )}

      {bestStreak >= 3 && (
        <p className="flex items-center gap-1.5 text-sm text-orange-600 font-semibold">
          <Flame size={16} />
          Best streak: {bestStreak} in a row!
        </p>
      )}

      {cleared ? (
        <>
          <p className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <Trophy size={18} />
            {difficulty} Completed!
          </p>
          <div className="flex flex-col gap-2 w-full mt-2">
            {nextDiff ? (
              <>
                <p className="text-xs text-emerald-700 font-semibold">{nextDiff} Level Unlocked!</p>
                <button
                  onClick={onContinue}
                  className="flex items-center justify-center gap-2 rounded-xl bg-rose-800 px-4 py-3 text-sm font-bold text-white shadow transition-transform active:scale-95 hover:bg-rose-900"
                >
                  <ArrowUpCircle size={16} />
                  Continue to {nextDiff}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-emerald-700 font-semibold">
                  All levels completed! Play the bonus rounds, or end the intervention.
                </p>
                <button
                  onClick={onContinue}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-800 px-4 py-3 text-sm font-bold text-white shadow transition-transform active:scale-95 hover:bg-indigo-900"
                >
                  <ArrowUpCircle size={16} />
                  Back to the road
                </button>
              </>
            )}
            <button
              onClick={onStop}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-bold hover:bg-gray-50 transition-transform active:scale-95"
            >
              <PauseCircle size={16} />
              Stop for now
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-amber-700 font-medium">
            A few to review — let's practice just those before moving on.
          </p>
          <div className="flex flex-col gap-2 w-full mt-2">
            <button
              onClick={onPracticeMissed}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white shadow transition-transform active:scale-95 hover:bg-amber-600"
            >
              <RefreshCcw size={16} />
              Practice Missed Questions
            </button>
            <button
              onClick={onStop}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-bold hover:bg-gray-50 transition-transform active:scale-95"
            >
              <PauseCircle size={16} />
              Stop for now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
// Shown after a round: score, streak, and what to do next.