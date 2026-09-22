import { useEffect, useRef, useState } from "react";
import { PartyPopper } from "lucide-react";

export interface MemoryPair {
  id: number;
  a: string;
  b?: string;
}

interface Card {
  uid: string; 
  pairId: number;
  label: string;
}

const FLIP_BACK_MS = 800;

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(pairs: MemoryPair[]): Card[] {
  return shuffle(
    pairs.flatMap((p) => [
      { uid: `${p.id}-a`, pairId: p.id, label: p.a },
      { uid: `${p.id}-b`, pairId: p.id, label: p.b ?? p.a },
    ])
  );
}

export default function MemoryGame({
  title = "Find the pairs",
  pairs,
  onDone,
}: {
  title?: string;
  pairs: MemoryPair[];
  onDone: (result: { moves: number }) => void;
}) {
  const [deck] = useState(() => buildDeck(pairs)); // shuffled once
  const [flipped, setFlipped] = useState<string[]>([]); // face-up cards not yet matched (max 2)
  const [matched, setMatched] = useState<number[]>([]); // pair ids
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false); // true while a mismatch is showing

  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const finished = matched.length === pairs.length;

  const flip = (card: Card) => {
    if (locked || flipped.includes(card.uid) || matched.includes(card.pairId)) return;

    const next = [...flipped, card.uid];
    setFlipped(next);
    if (next.length < 2) return;

    setMoves((m) => m + 1);
    const [first, second] = next.map((uid) => deck.find((c) => c.uid === uid)!);
    if (first.pairId === second.pairId) {
      setMatched((m) => [...m, first.pairId]);
      setFlipped([]);
    } else {
      setLocked(true);
      timerRef.current = window.setTimeout(() => {
        setFlipped([]);
        setLocked(false);
      }, FLIP_BACK_MS);
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      <div className="w-full rounded-3xl bg-linear-to-b from-indigo-500 to-indigo-800 px-5 py-4 text-left shadow-[0_5px_0_0_#312e81]">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-100">Bonus round</p>
        <p className="text-lg font-extrabold text-white">{title}</p>
        <p className="text-xs font-semibold text-indigo-100">Flip two cards. Match them to keep them.</p>
      </div>

      <div className="grid w-full grid-cols-4 gap-2">
        {deck.map((card) => {
          const isMatched = matched.includes(card.pairId);
          const isUp = isMatched || flipped.includes(card.uid);
          const small = Array.from(card.label).length > 2;
          return (
            <button
              key={card.uid}
              type="button"
              onClick={() => flip(card)}
              aria-label={isUp ? card.label : "Hidden card"}
              className="mm-card aspect-square rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
            >
              <span className={`mm-inner ${isUp ? "is-up" : ""}`}>
                {/* back of the card */}
                <span className="mm-face flex items-center justify-center rounded-2xl border-b-4 border-indigo-700 bg-indigo-400 text-2xl font-black text-white">
                  ?
                </span>
                {/* front of the card */}
                <span
                  className={`mm-face mm-front flex items-center justify-center rounded-2xl border-2 border-b-4 p-1 text-center font-extrabold leading-tight ${
                    small ? "text-xs" : "text-3xl"
                  } ${
                    isMatched
                      ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {card.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {finished ? (
        <button
          type="button"
          onClick={() => onDone({ moves })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-b from-emerald-400 to-emerald-600 px-4 py-4 text-base font-black text-white shadow-[0_5px_0_0_#047857] active:translate-y-0.75 active:shadow-[0_1px_0_0_#047857]"
        >
          <PartyPopper size={20} />
          Done in {moves} {moves === 1 ? "move" : "moves"}
        </button>
      ) : (
        <p className="text-xs font-semibold text-gray-500">
          {matched.length} of {pairs.length} found · {moves} {moves === 1 ? "move" : "moves"}
        </p>
      )}

      <style>{`
        .mm-card { perspective: 600px; }
        .mm-inner {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          transition: transform 0.35s;
          transform-style: preserve-3d;
        }
        .mm-inner.is-up { transform: rotateY(180deg); }
        .mm-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .mm-front { transform: rotateY(180deg); }
        @media (prefers-reduced-motion: reduce) {
          .mm-inner { transition: none; }
        }
      `}</style>
    </div>
  );
}