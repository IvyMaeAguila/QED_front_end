import { useEffect, useMemo, useRef, useState } from "react";
import {
  Radio,
  Rocket,
  Battery,
  Hand,
  Heart,
  Sparkles,
  Lock,
  CheckCircle2,
  ArrowRight,
  Apple,
  Sprout,
  Zap,
  Flame,
} from "lucide-react";
import type { Difficulty, InterventionState } from "../service/petQuiz.service";

import petIdle from "./assets/pet-idle.png";
import petHungry from "./assets/pet-hungry.png";
import petHappy from "./assets/pet-happy.png";

interface EDJourneyIntroProps {
  onContinue: () => void;
  intervention: InterventionState;
  petName?: string;
}

type Mood = "hopeful" | "neutral" | "worried" | "asking" | "happy" | "excited";

interface Scene {
  mood: Mood;
  lines: string[];
  buttonLabel: string;
}

const PET_SIZE = 240;
const LINE_STAGGER_MS = 800;

const DIFFICULTY_ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];

const LEVEL_META: Record<Difficulty, { icon: typeof Sprout; color: string }> = {
  Easy: { icon: Sprout, color: "bg-emerald-500" },
  Medium: { icon: Zap, color: "bg-amber-500" },
  Hard: { icon: Flame, color: "bg-rose-500" },
};

const buildScenes = (name: string): Scene[] => [
  {
    mood: "hopeful",
    lines: [
      "Uh... hello?",
      "Can you hear me?",
      "Thank goodness! I've been trying to find someone who could help me.",
    ],
    buttonLabel: "Next",
  },
  {
    mood: "neutral",
    lines: [
      `I'm ${name}!`,
      "I was travelling across the universe in my spaceship when I somehow lost my way.",
      "I flew past stars... past planets... and then...",
      "I ended up here on Earth!",
    ],
    buttonLabel: "Next",
  },
  {
    mood: "worried",
    lines: [
      "There's just one problem...",
      "My energy is almost gone.",
      "I need energy to power my spaceship.",
      "If I can't recharge, I won't be able to continue my journey home.",
    ],
    buttonLabel: "Next",
  },
  {
    mood: "asking",
    lines: [
      "But then I found you!",
      "I learned that you can help me recharge.",
      "Every time you answer a quiz question correctly, I get a little more energy!",
      "So... will you help me get home?",
    ],
    buttonLabel: `Yes, I'll help ${name}`,
  },
  {
    mood: "happy",
    lines: [
      "Great!",
      "To give me enough energy, we'll go through three levels together.",
      "First Easy, then Medium, and finally Hard.",
      "Every correct answer gives me more energy. Together, we can get my spaceship ready for takeoff!",
    ],
    buttonLabel: "Let's do this",
  },
  {
    mood: "excited",
    lines: [
      "Okay, partner!",
      "Let's start our journey.",
      "Help me recharge by answering the questions. I'll be counting on you!",
    ],
    buttonLabel: "Start the Quiz",
  },
];


const MOOD_IMAGE: Record<Mood, string> = {
  hopeful: petIdle,
  neutral: petIdle,
  worried: petHungry,
  asking: petHungry,
  happy: petHappy,
  excited: petHappy,
};

// -------------------- Pet --------------------
function PetAvatar({
  mood,
  name,
  talking,
  hopping,
  hearts,
  onPet,
}: {
  mood: Mood;
  name: string;
  talking: boolean;
  hopping: boolean;
  hearts: number[];
  onPet: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPet}
      aria-label={`Pet ${name}`}
      className="ej-pop relative block cursor-pointer select-none rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      style={{ width: PET_SIZE }}
    >
      <div className="ej-bob">
        <div className={hopping ? "ej-hop" : ""}>
          <img
            src={MOOD_IMAGE[mood]}
            alt={name}
            draggable={false}
            className={`block h-auto w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.2)] ${talking ? "ej-talk" : ""}`}
          />
        </div>
      </div>

      {hearts.map((id) => (
        <Heart
          key={id}
          size={22}
          aria-hidden="true"
          className="ej-heart pointer-events-none absolute fill-rose-500 text-rose-500"
          style={{ top: "6%", left: `${22 + (id % 5) * 13}%` }}
        />
      ))}
    </button>
  );
}

function SignalPing() {
  return (
    <div className="pointer-events-none absolute right-0 top-2 flex h-8 w-8 items-center justify-center">
      <span className="ej-ping absolute h-8 w-8 rounded-full bg-rose-400/40" />
      <Radio size={16} className="relative text-rose-500" />
    </div>
  );
}

function FlickeringSpark() {
  return <div className="ej-flicker pointer-events-none absolute right-4 top-4 h-3 w-3 rounded-full bg-amber-400" />;
}

function ReachingHand() {
  return (
    <div className="ej-handwave pointer-events-none absolute right-0 top-16 text-rose-500">
      <Hand size={28} />
    </div>
  );
}

function TravellingShip() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-19 h-8 overflow-hidden">
      <Rocket size={20} className="ej-fly-across absolute text-rose-500" />
    </div>
  );
}

// -------------------- Info panels --------------------
function EnergyApples({ filled, total }: { filled: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <Apple
          key={i}
          size={18}
          className={
            i < filled
              ? "fill-rose-500 text-rose-500 transition-colors duration-300"
              : "fill-white/80 text-gray-300 transition-colors duration-300"
          }
        />
      ))}
    </div>
  );
}

function EnergyBlock({ name, filled, total }: { name: string; filled: number; total: number }) {
  return (
    <div className="w-full rounded-2xl bg-white/60 px-3 py-2 ring-1 ring-white/70">
      <p className="flex items-center gap-2 text-xs font-bold text-gray-700">
        <Battery size={12} className="text-rose-500" /> {name}'s Energy
      </p>
      <div className="mt-1.5">
        <EnergyApples filled={filled} total={total} />
      </div>
    </div>
  );
}

// Shows the real lock / available / completed status of each level.
function LevelPath({ levels }: { levels: InterventionState["levels"] }) {
  return (
    <div className="w-full rounded-2xl bg-white/60 px-3 py-2 ring-1 ring-white/70">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900/80">
        <Sparkles size={12} className="text-amber-500" />
        Your quiz levels
      </p>
      <div className="mt-1.5 flex items-center gap-1">
        {DIFFICULTY_ORDER.map((d, i) => {
          const status = levels[d.toLowerCase() as "easy" | "medium" | "hard"];
          const meta = LEVEL_META[d];
          const Icon = meta.icon;
          const isLocked = status === "locked";
          const isCompleted = status === "completed";
          return (
            <div key={d} className="flex flex-1 items-center gap-1">
              <span
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-black ${
                  isLocked ? "bg-white/70 text-gray-400" : `${meta.color} text-white`
                }`}
              >
                {isLocked ? <Lock size={10} /> : isCompleted ? <CheckCircle2 size={10} /> : <Icon size={10} />}
                {d}
              </span>
              {i < DIFFICULTY_ORDER.length - 1 && (
                <ArrowRight size={12} className="shrink-0 text-emerald-900/40" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------- Main --------------------
export default function EDJourneyIntro({
  onContinue,
  intervention,
  petName = "ED",
}: EDJourneyIntroProps) {
  const [currentScene, setCurrentScene] = useState(0);
  const [talking, setTalking] = useState(true);
  const [hopping, setHopping] = useState(false);
  const [hearts, setHearts] = useState<number[]>([]);
  const heartId = useRef(0);

  const scenes = useMemo(() => buildScenes(petName), [petName]);
  const scene = scenes[currentScene];
  const isLastScene = currentScene === scenes.length - 1;

  // The pet "talks" (little squash-and-stretch) while the lines are coming in.
  useEffect(() => {
    setTalking(true);
    const t = setTimeout(() => setTalking(false), scenes[currentScene].lines.length * LINE_STAGGER_MS);
    return () => clearTimeout(t);
  }, [currentScene, scenes]);

  // Tap the pet: it hops and a heart floats up.
  const handlePet = () => {
    const id = heartId.current++;
    setHopping(true);
    setHearts((h) => [...h.slice(-3), id]);
    setTimeout(() => setHopping(false), 600);
    setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 1200);
  };

  const handleNext = () => {
    if (isLastScene) {
      onContinue();
    } else {
      setCurrentScene((s) => s + 1);
    }
  };

  return (
    <div className="relative isolate w-full max-w-md overflow-hidden rounded-3xl shadow-lg">
      {/* ================= SKY + PET ================= */}
      <div
        className="relative"
        style={{ background: "linear-gradient(to bottom, #bfe3ff 0%, #d9f0ff 70%, #eaf9e8 100%)" }}
      >
        {/* sun */}
        <div
          className="pointer-events-none absolute right-5 top-14 h-16 w-16 rounded-full"
          style={{ background: "radial-gradient(circle, #fff3b0 0%, rgba(255,243,176,0) 70%)" }}
        />
        {/* clouds */}
        <div className="ej-cloud pointer-events-none absolute left-6 top-16 h-8 w-16 rounded-full bg-white/70 blur-[2px]" />
        <div
          className="ej-cloud pointer-events-none absolute left-20 top-24 h-5 w-10 rounded-full bg-white/60 blur-[1px]"
          style={{ animationDelay: "-3s" }}
        />
        <div
          className="ej-cloud pointer-events-none absolute right-24 top-20 h-6 w-12 rounded-full bg-white/60 blur-[1px]"
          style={{ animationDelay: "-6s" }}
        />

        {currentScene === 1 && <TravellingShip />}

        {/* header: title + scene dots */}
        <div className="relative flex items-center justify-between px-5 pt-5">
          <p className="flex w-fit items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 ring-1 ring-white">
            <Sparkles size={11} className="text-amber-500" />
            {petName}'s Story
          </p>
          <div className="flex items-center gap-1">
            {scenes.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentScene ? "w-4 bg-rose-500" : i < currentScene ? "w-1.5 bg-rose-400/70" : "w-1.5 bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>

        {/* stage: pet standing on the hill */}
        <div className="relative mt-2 h-72.5 w-full">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
            style={{
              background: "linear-gradient(to bottom, #d7f2c9 0%, #b9e8a4 100%)",
              borderTopLeftRadius: "60% 100%",
              borderTopRightRadius: "60% 100%",
            }}
          />
          <div className="pointer-events-none absolute bottom-3 left-12 h-3 w-3 rounded-full bg-emerald-600/30" />
          <div className="pointer-events-none absolute bottom-5 right-14 h-2.5 w-2.5 rounded-full bg-emerald-600/30" />
          <div className="pointer-events-none absolute bottom-2 right-28 h-2 w-2 rounded-full bg-emerald-600/25" />

          {/* soft shadow under the pet */}
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-1 flex justify-center">
            <div
              className="ej-shadow h-5 w-[58%] rounded-full"
              style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.18), transparent 70%)" }}
            />
          </div>

          <div key={currentScene} className="absolute inset-x-0 bottom-3 z-2 flex justify-center">
            <div className="relative" style={{ width: PET_SIZE }}>
              <PetAvatar
                mood={scene.mood}
                name={petName}
                talking={talking}
                hopping={hopping}
                hearts={hearts}
                onPet={handlePet}
              />
              {currentScene === 0 && <SignalPing />}
              {currentScene === 2 && <FlickeringSpark />}
              {currentScene === 3 && <ReachingHand />}
            </div>
          </div>
        </div>
      </div>

      {/* ================= GRASS: dialogue + info + button ================= */}
      <div
        className="relative flex flex-col gap-3 px-5 pb-6 pt-5"
        style={{ background: "linear-gradient(to bottom, #b9e8a4 0%, #a6dd8b 100%)" }}
      >
        {/* dialogue box, replays per scene */}
        <div key={currentScene} className="flex flex-col gap-3">
          <div className="relative">
            <span className="absolute -top-3 left-5 z-10 rounded-full bg-rose-500 px-3 py-0.5 text-[11px] font-black uppercase tracking-wide text-white shadow">
              {petName}
            </span>
            <div className="relative rounded-3xl border-[3px] border-sky-200 bg-white px-4 pb-3.5 pt-5 text-left shadow-[0_5px_0_0_#bae6fd]">
              <div className="absolute -top-2.75 left-1/2 -translate-x-1/2" aria-hidden="true">
                <div className="h-4 w-4 rotate-45 border-l-[3px] border-t-[3px] border-sky-200 bg-white" />
              </div>
              <div className="flex flex-col gap-2">
                {scene.lines.map((line, i) => (
                  <p
                    key={i}
                    className="ej-line-in text-sm leading-relaxed text-gray-700"
                    style={{ animationDelay: `${i * LINE_STAGGER_MS}ms` }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {currentScene === 2 && (
            <EnergyBlock
              name={petName}
              filled={Math.min(1, intervention.hungerFilled)}
              total={intervention.hungerTotal}
            />
          )}

          {(currentScene === 4 || currentScene === 5) && <LevelPath levels={intervention.levels} />}

          {currentScene === 5 && (
            <EnergyBlock
              name={petName}
              filled={intervention.hungerFilled}
              total={intervention.hungerTotal}
            />
          )}
        </div>

        <button
          onClick={handleNext}
          className="ej-rise group relative mt-1 flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-linear-to-b from-rose-500 to-red-700 py-3 text-sm font-black text-white shadow-[0_5px_0_0_#7f1d1d,0_10px_24px_-8px_rgba(244,63,94,0.7)] transition-transform active:translate-y-0.75 active:shadow-[0_1px_0_0_#7f1d1d]"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="ej-shine pointer-events-none absolute inset-0" />
          {scene.buttonLabel}
          {isLastScene ? <Rocket size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>

      <style>{`
        .ej-bob, .ej-hop, .ej-talk, .ej-pop { transform-origin: 50% 100%; }

        @keyframes ejRise { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
        .ej-rise { animation: ejRise 0.5s ease-out backwards; }
        @keyframes ejLineIn { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        .ej-line-in { animation: ejLineIn 0.4s ease-out backwards; }
        @keyframes ejShine { 0% { transform: translateX(-120%) skewX(-20deg); } 100% { transform: translateX(220%) skewX(-20deg); } }
        .ej-shine { background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%); animation: ejShine 2.6s ease-in-out 1.6s infinite; }

        @keyframes ejBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .ej-bob { animation: ejBob 3s ease-in-out infinite; }
        @keyframes ejShadow { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.92); } }
        .ej-shadow { animation: ejShadow 3s ease-in-out infinite; }

        @keyframes ejPop { 0% { opacity: 0; transform: scale(0.85) translateY(10px); } 100% { opacity: 1; transform: none; } }
        .ej-pop { animation: ejPop 0.45s cubic-bezier(.34,1.56,.64,1) backwards; }

        @keyframes ejTalk {
          0%, 100% { transform: scale(1, 1); }
          25%      { transform: scale(1.03, 0.97); }
          50%      { transform: scale(0.98, 1.03); }
          75%      { transform: scale(1.02, 0.98); }
        }
        .ej-talk { animation: ejTalk 0.45s ease-in-out infinite; }

        @keyframes ejHop {
          0%   { transform: translateY(0) scale(1); }
          40%  { transform: translateY(-28px) scale(1.04, 0.97); }
          70%  { transform: translateY(0) scale(0.97, 1.04); }
          100% { transform: translateY(0) scale(1); }
        }
        .ej-hop { animation: ejHop 0.6s ease-out 1; }

        @keyframes ejHeart {
          0%   { opacity: 0; transform: translateY(0) scale(0.5); }
          20%  { opacity: 1; transform: translateY(-10px) scale(1); }
          100% { opacity: 0; transform: translateY(-64px) scale(1.15); }
        }
        .ej-heart { animation: ejHeart 1.1s ease-out forwards; }

        @keyframes ejCloud { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(14px); } }
        .ej-cloud { animation: ejCloud 12s ease-in-out infinite; }

        @keyframes ejPing { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(1.8); opacity: 0; } }
        .ej-ping { animation: ejPing 1.6s ease-out infinite; }
        @keyframes ejFlyAcross { 0% { left: -10%; transform: rotate(90deg); } 100% { left: 105%; transform: rotate(90deg); } }
        .ej-fly-across { animation: ejFlyAcross 3.2s linear infinite; top: 4px; }
        @keyframes ejFlicker { 0%, 100% { opacity: 1; } 45% { opacity: 0.2; } 55% { opacity: 1; } 80% { opacity: 0.3; } }
        .ej-flicker { animation: ejFlicker 1.4s ease-in-out infinite; }
        @keyframes ejHandwave { 0%, 100% { transform: rotate(0deg) translateY(0); } 25% { transform: rotate(-14deg) translateY(-2px); } 75% { transform: rotate(14deg) translateY(-2px); } }
        .ej-handwave { animation: ejHandwave 1.2s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .ej-rise, .ej-line-in, .ej-shine, .ej-bob, .ej-shadow, .ej-pop, .ej-talk, .ej-hop,
          .ej-heart, .ej-cloud, .ej-ping, .ej-fly-across, .ej-flicker, .ej-handwave {
            animation: none !important;
          }
          .ej-line-in { opacity: 1; }
        }
      `}</style>
    </div>
  );
}