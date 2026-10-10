import { SkeletonText, SkeletonControl } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { lastKnownCount, skeletonRows } from "@shared/loading/reservations";
import { CheckCircle2, RefreshCcw, XCircle } from "lucide-react";
import type { Difficulty, QuizQuestion } from "../service/petQuiz.service";
import { ProgressDots } from "./QuizWidgets";
import {
  CHOICE_COLORS,
  CHOICE_LABELS,
  type AnswerFeedback,
  type Choice,
  type RoundMode,
} from "./QuizShared";

interface QuizRoundProps {
  loading?: boolean;
  viewKey?: string;
  questions: QuizQuestion[];
  currentIndex: number;
  /** true = correct, false = wrong, null = not answered yet (one per question). */
  results: (boolean | null)[];
  roundMode: RoundMode;
  difficulty: Difficulty;
  /** The shuffled order the answer choices are shown in for the current question. */
  choiceOrder: Choice[];
  feedback: AnswerFeedback | null;
  isAnswering: boolean;
  onAnswer: (choice: Choice) => void;
}

export default function QuizRound({
  loading = false,
  viewKey = "quiz",
  questions,
  currentIndex,
  results,
  roundMode,
  difficulty,
  choiceOrder,
  feedback,
  isAnswering,
  onAnswer,
}: QuizRoundProps) {
  const question = questions[currentIndex];

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      {roundMode === "remedial" && (
        <p className="text-center text-xs font-semibold text-amber-700 flex items-center justify-center gap-1">
          <RefreshCcw size={13} />
          Practice round — just the ones you missed
        </p>
      )}
      {loading ? <div className="flex flex-wrap justify-center gap-1.5">{Array.from({length:Math.min(lastKnownCount(`${viewKey}:questions`,3),skeletonRows(viewKey))},(_,i)=><SkeletonControl key={i} className="h-2.5 w-2.5 rounded-full" />)}</div> : <ProgressDots total={questions.length} currentIndex={currentIndex} results={results} />}
      <p className="text-xs text-center text-gray-500">
        Question {currentIndex + 1} of {loading ? <SkeletonText width="2ch" className="inline-block" /> : questions.length} · {difficulty}
      </p>
      <p data-sk-variable="" data-sk-field={`${viewKey}:question`} className="text-lg font-bold text-center">{loading ? <SkeletonParagraph field={`${viewKey}:question`} typical={3} width="100%" /> : question?.question_text}</p>

      <div className="flex flex-col gap-2.5">
        {choiceOrder.map((choice, slot) => {
          const key = `choice_${choice.toLowerCase()}` as keyof QuizQuestion;
          const label = CHOICE_LABELS[slot];
          const colors = CHOICE_COLORS[label];
          let className = `border-2 rounded-2xl bg-white shadow-sm ${colors.idle}`;

          if (feedback) {
            if (choice === feedback.correctAnswer) {
              className = "border-2 border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300";
            } else if (choice === feedback.selected && !feedback.isCorrect) {
              className = "border-2 border-red-500 bg-red-50 ring-2 ring-red-300";
            } else {
              className = "border-2 border-gray-200 bg-white text-gray-500";
            }
          }

          return (
            <button
              key={choice}
              disabled={loading || isAnswering}
              onClick={() => onAnswer(choice)}
              className={`flex items-center gap-3 px-3 py-3 text-sm text-left font-medium transition-all disabled:cursor-not-allowed active:scale-[0.97] ${className}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${colors.badge}`}>
                {label}
              </span>
              <span data-sk-variable="" data-sk-field={`${viewKey}:choice:${slot}`} className="min-w-0">{loading ? <SkeletonParagraph field={`${viewKey}:choice:${slot}`} typical={2} width={`${18 - slot * 2}ch`} /> : question?.[key]}</span>
              {feedback && choice === feedback.correctAnswer && (
                <CheckCircle2 size={20} className="ml-auto text-emerald-600" />
              )}
              {feedback && choice === feedback.selected && !feedback.isCorrect && (
                <XCircle size={20} className="ml-auto text-red-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
// The inside of the quiz: progress dots, the question and its answer choices.
