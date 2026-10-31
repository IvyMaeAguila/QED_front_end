import type { Choice } from "./QuizShared";
interface Props {message:string;isCorrect:boolean;correctChoice:Choice;correctText:string;explanation:string;isLast:boolean;onNext:()=>void}
/** The next-question action lives below the answers; this bubble only explains the server-graded result. */
export default function PetSpeechBubble({isCorrect,correctText,explanation}:Props) {
 return <div className={`ed-feedback ${isCorrect?"ed-feedback-correct":"ed-feedback-wrong"}`} role="status" aria-live="polite" aria-atomic="true">
   <strong>{isCorrect?"Yum! Tama!":"Good try! Let's learn together."}</strong>{" "}
   {explanation?.trim()|| (isCorrect?"You got it! Keep going, learning partner.":`The answer is ${correctText}. We'll practice this again together.`)}
 </div>;
}
