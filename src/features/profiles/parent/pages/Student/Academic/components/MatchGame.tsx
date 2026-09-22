import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Check, PartyPopper } from "lucide-react";

export interface MatchPair {
  id: number;
  left: string; 
  right: string; 
}

interface Line {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// One colour per connected pair, in the order the student connects them.
const COLORS = [
  { card: "border-emerald-400 bg-emerald-50 text-emerald-800", line: "#34d399" },
  { card: "border-amber-400 bg-amber-50 text-amber-800", line: "#fbbf24" },
  { card: "border-rose-400 bg-rose-50 text-rose-800", line: "#fb7185" },
  { card: "border-sky-400 bg-sky-50 text-sky-800", line: "#38bdf8" },
  { card: "border-violet-400 bg-violet-50 text-violet-800", line: "#a78bfa" },
];

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchGame({
  title = "Connect the pairs",
  pairs,
  onDone,
}: {
  title?: string;
  pairs: MatchPair[];
  /** Called when the student taps "Done" after connecting everything. */
  onDone: (result: { mistakes: number }) => void;
}) {
  // Left keeps the given order; right is shuffled once so the answers aren't lined up.
  const [rightOrder] = useState(() => shuffle(pairs.map((p) => p.id)));
  const textOf = (id: number, side: "left" | "right") => pairs.find((p) => p.id === id)![side];

  const [selected, setSelected] = useState<number | null>(null); // left card waiting for a partner
  const [matched, setMatched] = useState<number[]>([]); // pair ids, in the order connected
  const [wrong, setWrong] = useState<{ left: number; right: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);

  const boxRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const colorOf = (id: number) => COLORS[matched.indexOf(id) % COLORS.length];
  const isMatched = (id: number) => matched.includes(id);
  const finished = matched.length === pairs.length;

  // Work out where each line starts and ends, from the cards' real positions.
  const measure = useCallback(() => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return;
    const next: Line[] = [];
    for (const id of matched) {
      const l = leftRefs.current[id]?.getBoundingClientRect();
      const r = rightRefs.current[id]?.getBoundingClientRect();
      if (!l || !r) continue;
      next.push({
        id,
        x1: l.right - box.left,
        y1: l.top + l.height / 2 - box.top,
        x2: r.left - box.left,
        y2: r.top + r.height / 2 - box.top,
      });
    }
    setLines(next);
  }, [matched]);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const pickLeft = (id: number) => {
    if (isMatched(id)) return;
    setSelected((cur) => (cur === id ? null : id));
  };

  const pickRight = (id: number) => {
    if (selected === null || isMatched(id)) return;
    if (selected === id) {
      setMatched((m) => [...m, id]);
    } else {
      setMistakes((n) => n + 1);
      setWrong({ left: selected, right: id });
      window.setTimeout(() => setWrong(null), 450);
    }
    setSelected(null);
  };

  const cardClass = (id: number, side: "left" | "right") => {
    const base =
      "relative z-10 flex min-h-[64px] w-full items-center justify-center rounded-2xl border-b-4 border-2 px-3 py-2 text-center text-sm font-extrabold leading-tight transition-transform active:translate-y-[2px]";
    if (isMatched(id)) return `${base} ${colorOf(id).card} cursor-default`;
    if (wrong && wrong[side] === id) return `${base} mg-shake border-red-400 bg-red-50 text-red-700`;
    if (side === "left" && selected === id)
      return `${base} border-indigo-500 bg-indigo-100 text-indigo-800 -translate-y-0.5 ring-4 ring-indigo-200`;
    return `${base} border-gray-200 bg-white text-gray-700 shadow-sm`;
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      <div className="w-full rounded-3xl bg-linear-to-b from-indigo-500 to-indigo-800 px-5 py-4 text-left shadow-[0_5px_0_0_#312e81]">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-100">Bonus round</p>
        <p className="text-lg font-extrabold text-white">{title}</p>
        <p className="text-xs font-semibold text-indigo-100">Tap a card, then tap its partner.</p>
      </div>

      <div ref={boxRef} className="relative grid w-full grid-cols-2 gap-x-12 gap-y-3">
        {/* the connecting lines sit behind the cards */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          {lines.map((ln) => {
            const mid = (ln.x1 + ln.x2) / 2;
            return (
              <path
                key={ln.id}
                d={`M ${ln.x1} ${ln.y1} C ${mid} ${ln.y1}, ${mid} ${ln.y2}, ${ln.x2} ${ln.y2}`}
                fill="none"
                stroke={colorOf(ln.id).line}
                strokeWidth={6}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        <div className="flex flex-col gap-3">
          {pairs.map((p) => (
            <button
              key={p.id}
              type="button"
              ref={(el) => {
                leftRefs.current[p.id] = el;
              }}
              onClick={() => pickLeft(p.id)}
              aria-pressed={selected === p.id}
              className={cardClass(p.id, "left")}
            >
              {p.left}
              {isMatched(p.id) && <Check size={14} strokeWidth={4} className="ml-1 shrink-0" />}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {rightOrder.map((id) => (
            <button
              key={id}
              type="button"
              ref={(el) => {
                rightRefs.current[id] = el;
              }}
              onClick={() => pickRight(id)}
              disabled={selected === null && !isMatched(id)}
              className={`${cardClass(id, "right")} disabled:cursor-not-allowed`}
            >
              {textOf(id, "right")}
              {isMatched(id) && <Check size={14} strokeWidth={4} className="ml-1 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {finished ? (
        <button
          type="button"
          onClick={() => onDone({ mistakes })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-b from-emerald-400 to-emerald-600 px-4 py-4 text-base font-black text-white shadow-[0_5px_0_0_#047857] active:translate-y-0.75 active:shadow-[0_1px_0_0_#047857]"
        >
          <PartyPopper size={20} />
          {mistakes === 0 ? "Perfect! Done" : "All connected! Done"}
        </button>
      ) : (
        <p className="text-xs font-semibold text-gray-500">
          {matched.length} of {pairs.length} connected
        </p>
      )}

      <style>{`
        @keyframes mgShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .mg-shake { animation: mgShake 0.35s ease-in-out; }
        @media (prefers-reduced-motion: reduce) {
          .mg-shake { animation: none !important; }
        }
      `}</style>
    </div>
  );
}