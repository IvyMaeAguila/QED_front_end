import { useState } from "react";
import { Apple, Star } from "lucide-react";

// -------------------- Energy Meter (renamed from Hunger, same mechanic) --------------------
export function HungerMeter({ filled, total }: { filled: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <Apple
          key={i}
          size={18}
          className={
            i < filled
              ? "fill-rose-500 text-rose-500 transition-colors duration-300"
              : "fill-gray-200 text-gray-200 transition-colors duration-300"
          }
        />
      ))}
    </div>
  );
}

export function ProgressDots({
  total,
  currentIndex,
  results,
}: {
  total: number;
  currentIndex: number;
  results: (boolean | null)[];
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const result = results[i];
        let dotClass = "bg-gray-200";
        if (result === true) dotClass = "bg-emerald-500";
        else if (result === false) dotClass = "bg-red-400";
        else if (i === currentIndex) dotClass = "bg-amber-400 animate-pulse";
        return <div key={i} className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${dotClass}`} />;
      })}
    </div>
  );
}

export function ConfettiBurst() {
  const [pieces] = useState(() => {
    const colors = ["bg-amber-400", "bg-emerald-400", "bg-sky-400", "bg-rose-400", "bg-violet-400"];
    return Array.from({ length: 12 }).map((_, i) => ({
      left: 8 + Math.random() * 84,
      delay: Math.random() * 0.2,
      color: colors[i % colors.length],
      shape: i % 2 === 0 ? "rounded-full" : "rounded-sm rotate-45",
    }));
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`absolute h-2.5 w-2.5 ${p.color} ${p.shape}`}
          style={{ left: `${p.left}%`, top: "20%", animation: `confettiFall 1s ease-out ${p.delay}s 1` }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(70px) rotate(180deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function StarRating({ ratio }: { ratio: number }) {
  const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map((s) => (
        <Star
          key={s}
          size={36}
          className={s <= stars ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
          style={{ animation: s <= stars ? `starPop 0.5s ease-out ${(s - 1) * 0.15}s both` : undefined }}
        />
      ))}
      <style>{`
        @keyframes starPop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.3) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}