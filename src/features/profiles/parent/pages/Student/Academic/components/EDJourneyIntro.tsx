import { useState } from "react";
import { Apple, ArrowLeft, ArrowRight, Heart, Hand, Sparkles, Lock, Check } from "lucide-react";
import type { InterventionState } from "../service/petQuiz.service";
import QedPet from "./QedPet";
interface Props { loading?:boolean; onContinue:()=>void; intervention:InterventionState; petName?:string }
const SCENES=[
 {title:"A little friend needs you",line:"Hello! I'm Ed. I was exploring this beautiful garden when my tummy started to rumble. Will you say hello?",action:"Wave to Ed",done:"Hello, learning partner! I'm so happy you're here.",button:"Meet Ed",icon:Hand},
 {title:"Learning is our superpower",line:"I love learning snacks! When we finish our challenges, you help fill my tummy. Tap the apple to see my happy dance!",action:"Show Ed an apple",done:"Yum! That was a practice snack. Our real adventure is waiting!",button:"Show me the adventure",icon:Apple},
 {title:"One step at a time",line:"We'll explore Easy, Medium, and Hard, then play Matching and Memory. If we miss an answer, we'll learn why and practice together.",action:"Give Ed encouragement",done:"We don't have to get everything right the first time. We can learn together!",button:"We're a team!",icon:Heart},
 {title:"Ready, learning partner?",line:"Choose an available challenge on the path. Read the question and tap your answer. I'll be right here to cheer you on!",action:"High five, Ed!",done:"High five! Let's grow our knowledge, one question at a time.",button:"Start the Quiz",icon:Sparkles},
];
export default function EDJourneyIntro({loading=false,onContinue,intervention,petName="ED"}:Props) {
 const [scene,setScene]=useState(0),[reacted,setReacted]=useState(false),[reaction,setReaction]=useState(0);
 const current=SCENES[scene],Icon=current.icon;
 function react(){setReacted(true);setReaction(value=>value+1);}
 function change(next:number){setScene(next);setReacted(false);}
 return <section className="ed-story" aria-label="Ed's interactive story">
   <div className="ed-story-heading"><p>{petName}'s Story</p><span>Chapter {scene+1} of {SCENES.length}</span></div>
   <div className="ed-story-steps" aria-label="Story progress">{SCENES.map((item,index)=><span key={item.title} className={index<=scene?"is-filled":""}/>)}</div>
   <div className="ed-story-stage">
     <div className="ed-story-bubble" aria-live="polite" key={`${scene}-${reacted}`}><strong>{current.title}</strong><p>{reacted?current.done:current.line}</p></div>
     <button type="button" className="ed-pet-touch" disabled={loading} onClick={react} aria-label="Say hello to Ed"><QedPet key={reaction} state={loading?"thinking":reacted?"happy":scene===1?"hungry":"idle"}/></button>
     {reacted&&<span key={reaction} className="ed-story-heart" aria-hidden="true">♥</span>}
   </div>
   <div className="ed-story-card">
     <button type="button" className="ed-story-activity" disabled={loading} onClick={react}><Icon size={24}/>{reacted?"Again!":current.action}</button>
     {scene===2&&<div className="ed-story-levels">{(["easy","medium","hard"] as const).map(level=><span key={level}>{intervention.levels[level]==="locked"?<Lock size={15}/>:intervention.levels[level]==="completed"?<Check size={15}/>:<Sparkles size={15}/>}<span>{level}</span></span>)}</div>}
     {loading&&<p role="status" className="ed-loading-label">Ed is getting your adventure ready<span className="ed-loading-dots" aria-hidden="true">…</span></p>}
     <div className="ed-story-actions">{scene>0&&<button type="button" className="ed-secondary" disabled={loading} onClick={()=>change(scene-1)}><ArrowLeft size={18}/>Back</button>}<button type="button" className="ed-primary" disabled={loading} onClick={()=>scene===SCENES.length-1?onContinue():change(scene+1)}>{current.button}<ArrowRight size={20}/></button></div>
   </div>
 </section>;
}
