import { SkeletonText } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { Check, X, Circle, Square, Triangle, Star, RefreshCcw } from "lucide-react";
import type { Difficulty, QuizQuestion } from "../service/petQuiz.service";
import type { AnswerFeedback, Choice, RoundMode } from "./QuizShared";
interface Props {
  loading?:boolean; viewKey?:string; questions:QuizQuestion[]; currentIndex:number;
  results:(boolean|null)[]; roundMode:RoundMode; difficulty:Difficulty; choiceOrder:Choice[];
  feedback:AnswerFeedback|null; isAnswering:boolean; onAnswer:(choice:Choice)=>void;
}
const SHAPES=[Circle,Square,Triangle,Star];
export default function QuizRound({loading=false,viewKey="quiz",questions,currentIndex,roundMode,difficulty,choiceOrder,feedback,isAnswering,onAnswer}:Props) {
  const question=questions[currentIndex];
  return <section className="adventure-question ed-question" aria-label="Quiz question">
    {roundMode==="remedial"&&<p className="ed-practice"><RefreshCcw size={16}/>Practice round — just the ones you missed</p>}
    <p className="ed-question-meta">Question {currentIndex+1} of {loading?<SkeletonText width="2ch" className="inline-block"/>:questions.length} · {difficulty}</p>
    <h1 data-type-exempt="true" data-sk-variable="" data-sk-field={`${viewKey}:question`}>{loading?<SkeletonParagraph field={`${viewKey}:question`} typical={2} width="100%"/>:question?.question_text}</h1>
    <div className="ed-answers">{choiceOrder.map((choice,slot)=>{
      const text=String(question?.[`choice_${choice.toLowerCase()}` as keyof QuizQuestion]??"");
      const correct=!!feedback&&choice===feedback.correctAnswer;
      const wrong=!!feedback&&!feedback.isCorrect&&choice===feedback.selected;
      const Shape=SHAPES[slot];
      return <button key={choice} type="button" disabled={loading||isAnswering||!!feedback}
        aria-label={loading?`Loading answer ${slot+1}`:text} onClick={()=>onAnswer(choice)}
        className={`ed-answer ed-answer-${slot} ${correct?"is-correct":wrong?"is-wrong":feedback?"is-muted":""}`}>
        <Shape aria-hidden="true" className="ed-answer-shape" fill="currentColor"/>
        <span data-sk-variable="" data-sk-field={`${viewKey}:choice:${slot}`} className={text.length>24?"ed-answer-long":""}>{loading?<SkeletonParagraph field={`${viewKey}:choice:${slot}`} typical={2} width="100%"/>:text}</span>
        <span className="ed-answer-mark">{correct?<Check aria-label="Correct answer"/>:wrong?<X aria-label="Incorrect answer"/>:null}</span>
      </button>;
    })}</div>
  </section>;
}
