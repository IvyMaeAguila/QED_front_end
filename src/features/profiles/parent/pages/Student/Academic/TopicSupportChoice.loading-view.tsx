import "./intervention-adventure.css";
import "./quest-portals.css";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import QedPet from "./components/QedPet";
import QuestWorldBackground from "./components/QuestWorldBackground";

function useTopicSupportChoiceState() {
 const {studentId,topicId}=useParams<{studentId:string;topicId:string}>();
 const navigate=useNavigate();
 return {content:<div className="quest-portals relative isolate min-h-dvh" data-sk-region="topic-support-content">
  <QuestWorldBackground/>
  <div className="qp-page">
   <div className="qp-top"><button type="button" className="qp-back" aria-label="Back to academic support" onClick={()=>navigate(`/parent/students/${studentId}?tab=academic`,{state:{tab:"academic"}})}><ArrowLeft size={24}/></button><p>Quest Board</p></div>
   <header className="qp-sign"><span>Pick your path</span><h1 data-type-exempt="true">Your adventure starts here!</h1><p>Step through a portal to discover something new or help your pet grow.</p></header>
   <div className="qp-options">
    <Portal kind="learn" title="Learn" tag="Study Quest" description="Explore your lesson, discover new ideas, and watch learning videos." action="Enter" onClick={()=>navigate(`/parent/students/${studentId}/topics/${topicId}/courseware`)}/>
    <Portal kind="quiz" title="Quiz" tag="Feed your pet" description="A gamified quiz for this topic — feed your pet by answering correctly!" action="Let's play" onClick={()=>navigate(`/parent/students/${studentId}/topics/${topicId}/quiz`)}/>
   </div>
  </div>
 </div>,scope:{}};
}
function Portal({kind,title,tag,description,action,onClick}:{kind:"learn"|"quiz";title:string;tag:string;description:string;action:string;onClick:()=>void}) {
 return <button type="button" className={`qp-portal qp-${kind}`} onClick={onClick} aria-label={kind==="learn"?"Learn: Enter Study Quest":"Quiz: Let's play with Ed"}>
  <span className="qp-arch" aria-hidden="true"><span className="qp-swirl"/><span className="qp-core"/>
   {kind==="learn"?<><span className="qp-float qp-one">✦</span><span className="qp-float qp-two">?</span><span className="qp-float qp-three">✎</span><span className="qp-book">📖</span></>:<><span className="qp-ed-label">Ed is waiting for you!</span><span className="qp-float qp-one">🍎</span><span className="qp-float qp-two">🍌</span><span className="qp-float qp-three">⭐</span><QedPet state="hungry" className="qp-ed"/></>}
  </span>
  <span className="qp-plaque"><span className="qp-tag">{tag}</span><span className="qp-title">{title}</span><span className="qp-description">{description}</span><span className="qp-enter">{action}<ArrowRight size={22}/></span></span>
 </button>;
}
export type TopicSupportChoiceEffectScope=ReturnType<typeof useTopicSupportChoiceState>["scope"];
export type TopicSupportChoiceRouteProps=Record<string,never>;
export function TopicSupportChoiceComposition(props:object&{effects?:(scope:TopicSupportChoiceEffectScope)=>import("react").ReactNode}) {
 const state=useTopicSupportChoiceState();return <>{props.effects?.(state.scope)}{state.content}</>;
}
