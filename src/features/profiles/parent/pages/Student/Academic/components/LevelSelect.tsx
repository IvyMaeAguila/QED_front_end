import { Book, Brain, Check, Lock, Puzzle, Rocket, type LucideIcon } from "lucide-react";
import type { Difficulty, InterventionState, LevelStatus } from "../service/petQuiz.service";
import { DIFFICULTY_ORDER, LEVEL_META } from "./QuizShared";

type LevelKey = "easy" | "medium" | "hard";

export type BonusGame = "match" | "memory";

// ---------- road layout ----------
const NODE = 84; 
const ROW = 112; 
const TOP = 56;
const VB_W = 300; 
/** Where each stop sits across the road (% of its width). This makes the winding path. */
const X = [50, 50, 72, 34, 68, 44];

type RoadStop =
  | { kind: "story" }
  | { kind: "level"; difficulty: Difficulty }
  | { kind: "bonus"; game: BonusGame; label: string; icon: LucideIcon }
  | { kind: "soon"; icon: LucideIcon };

const ROAD: RoadStop[] = [
  { kind: "story" },
  ...DIFFICULTY_ORDER.map((difficulty): RoadStop => ({ kind: "level", difficulty })),
  { kind: "bonus", game: "match", label: "Match", icon: Puzzle },
  { kind: "bonus", game: "memory", label: "Memory", icon: Brain },
];

const NODE_COLORS: Record<Difficulty, { face: string; edge: string; halo: string; bubble: string }> = {
  Easy: { face: "bg-emerald-400", edge: "bg-emerald-600", halo: "border-emerald-300", bubble: "bg-emerald-500" },
  Medium: { face: "bg-amber-400", edge: "bg-amber-600", halo: "border-amber-300", bubble: "bg-amber-500" },
  Hard: { face: "bg-rose-400", edge: "bg-rose-600", halo: "border-rose-300", bubble: "bg-rose-500" },
};

// ---------- stops ----------

/** The story stop: always unlocked, replayable anytime. */
function StoryNode({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={onClick}
        aria-label="Replay the story"
        className="group relative block rounded-full outline-none focus-visible:ring-4 focus-visible:ring-purple-300"
        style={{ width: NODE, height: NODE }}
      >
        {/* the coin's edge (its thickness) */}
        <span className="absolute inset-x-0 bottom-0 h-18 rounded-full bg-purple-700" />

        {/* the coin's face */}
        <span className="absolute inset-x-0 top-0 flex h-18 items-center justify-center rounded-full bg-purple-400 ring-[6px] ring-white/30 transition-transform group-active:translate-y-1.5">
          <Book size={32} className="text-white" />
        </span>
      </button>

      <span className="mt-2 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-black text-gray-700 shadow-sm">
        Story
      </span>
    </div>
  );
}

function LevelNode({
  difficulty,
  status,
  isCurrent,
  onClick,
}: {
  difficulty: Difficulty;
  status: LevelStatus;
  isCurrent: boolean;
  onClick: () => void;
}) {
  const Icon = LEVEL_META[difficulty].icon;
  const c = NODE_COLORS[difficulty];
  const locked = status === "locked";
  const completed = status === "completed";

  return (
    <div className="relative flex flex-col items-center">
      {/* "Start" bubble over the stop you should play next */}
      {isCurrent && (
        <div className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2">
          <div className={`rm-float relative whitespace-nowrap rounded-2xl px-3 py-1.5 text-xs font-black text-white shadow-md ${c.bubble}`}>
            Start {difficulty}
            <span className={`absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 ${c.bubble}`} />
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={locked}
        onClick={onClick}
        aria-label={`${difficulty} level, ${status}`}
        className="group relative block rounded-full outline-none focus-visible:ring-4 focus-visible:ring-rose-300 disabled:cursor-not-allowed"
        style={{ width: NODE, height: NODE }}
      >
        {isCurrent && <span className={`rm-pulse absolute -inset-2 rounded-full border-4 ${c.halo}`} />}

        {/* the coin's edge (its thickness) */}
        <span className={`absolute inset-x-0 bottom-0 h-18 rounded-full ${locked ? "bg-gray-300" : c.edge}`} />

        {/* the coin's face */}
        <span
          className={`absolute inset-x-0 top-0 flex h-18 items-center justify-center rounded-full ring-[6px] ring-white/30 transition-transform ${
            locked ? "bg-gray-200" : `${c.face} group-active:translate-y-1.5`
          }`}
        >
          {locked ? <Lock size={30} className="text-gray-400" /> : <Icon size={34} className="text-white" />}
        </span>

        {completed && (
          <span className="absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow">
            <Check size={16} strokeWidth={4} className="text-emerald-500" />
          </span>
        )}
      </button>

      <span
        className={`mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-black ${
          locked ? "bg-white/70 text-gray-400" : "bg-white text-gray-700 shadow-sm"
        }`}
      >
        {difficulty}
      </span>
    </div>
  );
}

function BonusNode({
  icon: Icon,
  label,
  locked,
  done,
  isCurrent,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  locked: boolean;
  done: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center">
      {isCurrent && (
        <div className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2">
          <div className="rm-float relative whitespace-nowrap rounded-2xl bg-indigo-500 px-3 py-1.5 text-xs font-black text-white shadow-md">
            Play bonus
            <span className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-indigo-500" />
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={locked}
        onClick={onClick}
        aria-label={`${label} bonus round, ${locked ? "locked" : done ? "completed" : "available"}`}
        className="group relative block rounded-full outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:cursor-not-allowed"
        style={{ width: NODE, height: NODE }}
      >
        {isCurrent && <span className="rm-pulse absolute -inset-2 rounded-full border-4 border-indigo-300" />}

        <span className={`absolute inset-x-0 bottom-0 h-18 rounded-full ${locked ? "bg-gray-300" : "bg-indigo-700"}`} />

        <span
          className={`absolute inset-x-0 top-0 flex h-18 items-center justify-center rounded-full ring-[6px] ring-white/30 transition-transform ${
            locked ? "bg-gray-200" : "bg-indigo-400 group-active:translate-y-1.5"
          }`}
        >
          {locked ? <Lock size={30} className="text-gray-400" /> : <Icon size={34} className="text-white" />}
        </span>

        {done && (
          <span className="absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow">
            <Check size={16} strokeWidth={4} className="text-emerald-500" />
          </span>
        )}
      </button>

      <span
        className={`mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-black ${
          locked ? "bg-white/70 text-gray-400" : "bg-white text-gray-700 shadow-sm"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function SoonNode({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="relative flex flex-col items-center" aria-label="Coming soon">
      <div className="relative" style={{ width: NODE, height: NODE }}>
        <span className="absolute inset-x-0 bottom-0 h-18 rounded-full bg-gray-300" />
        <span className="absolute inset-x-0 top-0 flex h-18 items-center justify-center rounded-full border-4 border-dashed border-gray-300 bg-gray-100">
          <Icon size={28} className="text-gray-300" />
        </span>
      </div>
      <span className="mt-2 rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-black text-gray-400">
        Coming soon
      </span>
    </div>
  );
}

// ---------- end button ----------
function EndButton({ unlocked, onClick }: { unlocked: boolean; onClick: () => void }) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <button
        type="button"
        disabled={!unlocked}
        onClick={onClick}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-base font-black transition-transform disabled:cursor-not-allowed ${
          unlocked
            ? "bg-linear-to-b from-indigo-500 to-indigo-800 text-white shadow-[0_5px_0_0_#312e81] active:translate-y-0.75 active:shadow-[0_1px_0_0_#312e81]"
            : "bg-gray-200 text-gray-400 shadow-[0_5px_0_0_#d1d5db]"
        }`}
      >
        {unlocked ? <Rocket size={20} /> : <Lock size={20} />}
        End Intervention
      </button>
      <p className="text-center text-xs font-semibold text-gray-500">
        {unlocked
          ? "Your friend has enough energy to continue the journey!"
          : "Finish Easy, Medium, Hard, Matching and Memory to unlock"}
      </p>
    </div>
  );
}

// ---------- main ----------
export default function LevelSelect({
  levels,
  error,
  bonusDone = {},
  onSelect,
  onSelectBonus,
  onEnd,
  onShowStory,
}: {
  levels: InterventionState["levels"];
  error: string | null;
  /** Which bonus rounds the student has finished. */
  bonusDone?: Partial<Record<BonusGame, boolean>>;
  onSelect: (difficulty: Difficulty) => void;
  /** Called when the (unlocked) bonus stop is tapped. */
  onSelectBonus: (game: BonusGame) => void;
  /** Called when the (unlocked) End Intervention button is tapped. */
  onEnd: () => void;
  /** Replay the intro story. Shows the Story node at the top of the road when provided. */
  onShowStory?: () => void;
}) {
  const statusOf = (d: Difficulty): LevelStatus => levels?.[d.toLowerCase() as LevelKey] ?? "locked";

  // The stop to play next: the first level that is unlocked but not completed.
  const currentDifficulty = DIFFICULTY_ORDER.find((d) => statusOf(d) === "available") ?? null;
  const allDone = DIFFICULTY_ORDER.every((d) => statusOf(d) === "completed");

  // The End button requires EVERYTHING: all 3 levels AND both bonus games.
  const allStepsDone = allDone && !!bonusDone.match && !!bonusDone.memory;

  // The bonus stop to highlight: the first one not played yet (only once every level is done).
  const currentBonus = allDone
    ? ROAD.find((s): s is Extract<RoadStop, { kind: "bonus" }> => s.kind === "bonus" && !bonusDone[s.game])?.game ?? null
    : null;

  // The road only shows the Story stop when the parent gave us a handler for it.
  const road = onShowStory ? ROAD : ROAD.filter((s) => s.kind !== "story");
  const xPositions = onShowStory ? X : X.slice(1);

  const centerY = (i: number) => TOP + NODE / 2 + i * ROW;
  const height = TOP + (road.length - 1) * ROW + NODE + 34;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      {/* banner */}
      <div className="w-full rounded-3xl bg-linear-to-b from-rose-500 to-rose-700 px-5 py-4 text-left shadow-[0_5px_0_0_#881337]">
        <p className="text-xs font-bold uppercase tracking-wide text-rose-100">Recharge Road</p>
        <p className="text-lg font-extrabold text-white">Choose your challenge!</p>
      </div>

      {error && (
        <p
          role="alert"
          className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700"
        >
          {error}
        </p>
      )}

      {/* the road */}
      <div className="relative w-full max-w-75" style={{ height }}>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VB_W} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {road.slice(0, -1).map((_, i) => {
            const x1 = (xPositions[i] / 100) * VB_W;
            const x2 = (xPositions[i + 1] / 100) * VB_W;
            const y1 = centerY(i);
            const y2 = centerY(i + 1);
            const mid = (y1 + y2) / 2;
            const stop = road[i];
            const done =
              stop.kind === "story" ||
              (stop.kind === "level" && statusOf(stop.difficulty) === "completed") ||
              (stop.kind === "bonus" && !!bonusDone[stop.game]);
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                fill="none"
                stroke={done ? "#34d399" : "#cbd5e1"}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={done ? undefined : "1 14"}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {road.map((stop, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2"
            style={{ left: `${xPositions[i]}%`, top: centerY(i) - NODE / 2 }}
          >
            {stop.kind === "story" ? (
              <StoryNode onClick={onShowStory!} />
            ) : stop.kind === "level" ? (
              <LevelNode
                difficulty={stop.difficulty}
                status={statusOf(stop.difficulty)}
                isCurrent={stop.difficulty === currentDifficulty}
                onClick={() => onSelect(stop.difficulty)}
              />
            ) : stop.kind === "bonus" ? (
              <BonusNode
                icon={stop.icon}
                label={stop.label}
                locked={!allDone}
                done={!!bonusDone[stop.game]}
                isCurrent={stop.game === currentBonus}
                onClick={() => onSelectBonus(stop.game)}
              />
            ) : (
              <SoonNode icon={stop.icon} />
            )}
          </div>
        ))}
      </div>

      {/* end of the road */}
      <EndButton unlocked={allStepsDone} onClick={onEnd} />

      <style>{`
        @keyframes rmFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
        .rm-float { animation: rmFloat 1.2s ease-in-out infinite; }

        @keyframes rmPulse {
          0%   { transform: scale(0.95); opacity: 0.9; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        .rm-pulse { animation: rmPulse 1.6s ease-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .rm-float, .rm-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
}