import { Sprout, Zap, Flame } from "lucide-react";
import type { Difficulty, QuizQuestion } from "../service/petQuiz.service";

export type Choice = "A" | "B" | "C" | "D";
export type RoundMode = "full" | "remedial";

export interface AnswerFeedback {
  selected: Choice;
  correctAnswer: Choice;
  isCorrect: boolean;
  explanation: string;
}

export const DIFFICULTY_ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];

export const LEVEL_META: Record<Difficulty, { icon: typeof Sprout; color: string }> = {
  Easy: { icon: Sprout, color: "bg-emerald-500" },
  Medium: { icon: Zap, color: "bg-amber-500" },
  Hard: { icon: Flame, color: "bg-rose-500" },
};

export const CHOICE_LABELS: Choice[] = ["A", "B", "C", "D"];

export const CHOICE_COLORS: Record<Choice, { badge: string; idle: string }> = {
  A: { badge: "bg-rose-500", idle: "border-rose-200 hover:border-rose-400 hover:bg-rose-50" },
  B: { badge: "bg-sky-500", idle: "border-sky-200 hover:border-sky-400 hover:bg-sky-50" },
  C: { badge: "bg-amber-500", idle: "border-amber-200 hover:border-amber-400 hover:bg-amber-50" },
  D: { badge: "bg-violet-500", idle: "border-violet-200 hover:border-violet-400 hover:bg-violet-50" },
};

export const CORRECT_MESSAGES = [
  "Yes! Nailed it!",
  "Boom! You got it!",
  "Awesome job!",
  "Super smart!",
  "You're on fire!",
  "Correct! Keep it up!",
];

export const WRONG_MESSAGES = [
  "So close! Let's check it out.",
  "Not quite — here's why:",
  "Nice try! Here's the answer:",
  "Almost! Let's learn this one:",
];

export function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function nextDifficulty(current: Difficulty): Difficulty | null {
  const idx = DIFFICULTY_ORDER.indexOf(current);
  return idx >= 0 && idx + 1 < DIFFICULTY_ORDER.length ? DIFFICULTY_ORDER[idx + 1] : null;
}

// -------------------- Answer shuffling --------------------
const POSITION_DEPENDENT_TEXT =
  /\b(all|none|both|neither)\s+of\s+(the\s+)?(above|these|following|them)\b|\b(?:[Oo]ption|[Cc]hoice|[Aa]nswer)s?\s+[A-D]\b|\b[A-D]\s+(?:and|&|or)\s+[A-D]\b/i;

function shuffled<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildChoiceOrders(questions: QuizQuestion[]): Record<string, Choice[]> {
  const orders: Record<string, Choice[]> = {};
  for (const q of questions) {
    const texts = CHOICE_LABELS.map((c) => String(q[`choice_${c.toLowerCase()}` as keyof QuizQuestion] ?? ""));
    const pinned = texts.some((t) => POSITION_DEPENDENT_TEXT.test(t));
    orders[String(q.id)] = pinned ? [...CHOICE_LABELS] : shuffled(CHOICE_LABELS);
  }
  return orders;
}