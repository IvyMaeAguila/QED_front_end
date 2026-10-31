import {lazy,Suspense,useRef,useState} from "react";
import {useRouteEffect as useEffect} from "@shared/loading/RoutePreview";
import QedPet from "@shared/components/QedPet";
import {Reveal} from "./Reveal";
import "./intervention-showcase.css";

const Preview=lazy(()=>import("./InterventionPreview"));
export const InterventionSection=()=>{
 const ref=useRef<HTMLDivElement>(null);
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setVisible(true);observer.disconnect();}},{rootMargin:"250px"});
  if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();
 },[]);
 const placeholder=<div className="li-placeholder" aria-label="Intervention feature preview"><span>Learn. Practice. Grow with Ed.</span><p>A focused learning journey for every flagged topic.</p></div>;
 return <section id="intervention" className="landing-intervention">
  <div className="li-container">
   <Reveal className="li-intro"><div><p className="li-eyebrow">QED intervention · Learning through play</p><h2>A little support.<br/>A whole new adventure.</h2></div><p>Turn a topic that needs review into a learning journey. Explore lessons, watch related videos, and build confidence with Ed—one challenge at a time.</p></Reveal>
   <div ref={ref}>{visible?<Suspense fallback={placeholder}><Preview Pet={QedPet}/></Suspense>:placeholder}</div>
   <div className="li-outcomes"><p><strong>Topic-focused support</strong><span>Lessons and practice follow the topic that needs attention.</span></p><p><strong>Practice with encouragement</strong><span>Clear explanations and practice rounds make mistakes part of learning.</span></p><p><strong>A journey families can share</strong><span>Parents can guide the lesson and follow their child's progress.</span></p></div>
  </div>
 </section>;
};
