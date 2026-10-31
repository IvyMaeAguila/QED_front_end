import "./study-quest.css";
import { AlertTriangle,ArrowLeft,BookOpen,Check,Compass,Pencil,Play,Star,MonitorPlay,Apple } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { SkeletonImage,SkeletonText } from "../../../../../../shared/components/SkeletonLoading";
import { LoadingRegion } from "../../../../../../shared/loading/LoadingRegion";
import { rememberRows,skeletonRows } from "../../../../../../shared/loading/reservations";
import { SkeletonParagraph } from "../../../../../../shared/loading/SkeletonParagraph";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { CoursewareResource } from "./service/courseware.service";
import { getCourseware } from "./service/courseware.service";

interface CoursewareViewProps {
  darkMode?: boolean;
  serverState?: {data?:CoursewareResource;loading:boolean;error:string|null;retry:()=>void;denied?:boolean};
}

interface LessonSection { title: string; lines: string[] }
function lessonSections(content: string): LessonSection[] {
 const sections:LessonSection[]=[];
 for(const line of content.split("\n")) {
  const trimmed=line.trim(); if(!trimmed)continue;
  if(trimmed.startsWith("## "))sections.push({title:trimmed.slice(3),lines:[]});
  else {if(!sections.length)sections.push({title:"Explore the lesson",lines:[]});sections[sections.length-1].lines.push(trimmed);}
 }
 return sections;
}
function renderLesson(content:string,pending:boolean,view:string,marked:Set<string>,toggle:(key:string)=>void) {
 return lessonSections(content).map((section,index)=>{
  const objectives=/objective/i.test(section.title),parents=/parent/i.test(section.title);
  const bullets=section.lines.filter(line=>line.startsWith("- "));
  const total=bullets.length;
  return <section key={index} className={parents?"sq-parent-note": "sq-notebook"}>
   <div className="sq-section-heading"><h3 data-sk-variable="" data-sk-region={`lesson-heading-${index}`} data-sk-field={`${view}:heading:${index}`}>{pending?<SkeletonParagraph field={`${view}:heading:${index}`} typical={1}/>:section.title}</h3>
    {objectives&&!pending&&total>0&&<span className="sq-objective-count" aria-label={`${bullets.filter((_,i)=>marked.has(`${index}:${i}`)).length} of ${total} objectives marked on this page`}><Star size={18} fill="#ffd34f"/>{bullets.filter((_,i)=>marked.has(`${index}:${i}`)).length}/{total}</span>}
   </div>
   {section.lines.map((line,lineIndex)=>{
    const bullet=line.startsWith("- "),key=`${index}:${section.lines.slice(0,lineIndex).filter(item=>item.startsWith("- ")).length}`;
    return <div key={lineIndex} className={`sq-lesson-line ${bullet?"sq-bullet":""}`}>
     {bullet&&(objectives?<button type="button" className="sq-objective-check" disabled={pending} aria-label={`Mark objective: ${line.slice(2)}`} aria-pressed={marked.has(key)} onClick={()=>toggle(key)}>{marked.has(key)&&<Check size={22}/>}</button>:<span className="sq-bullet-dot" aria-hidden="true"/>)}
     <p data-sk-variable="" data-sk-region={`lesson-paragraph-${index}-${lineIndex}`} data-sk-field={`${view}:paragraph:${index}:${lineIndex}`}>{pending?<SkeletonParagraph field={`${view}:paragraph:${index}:${lineIndex}`} typical={2} width="100%"/>:bullet?line.slice(2):line}</p>
    </div>;
   })}
   {objectives&&!pending&&total>0&&<p className="sq-practice-note">Tap a circle as you practice. These checkmarks stay on this page only.</p>}
  </section>;
 });
}

// De-duplicate videos by URL. The backend/upstream video source can
// occasionally return the same video more than once (e.g. duplicate
// search hits), which previously caused React "duplicate key" warnings
// and could make list items render/update unpredictably.
function dedupeVideos(videos: CoursewareResource["videos"]) {
  const seen = new Set<string>();
  return videos.filter((v) => {
    if (seen.has(v.url)) return false;
    seen.add(v.url);
    return true;
  });
}

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    let videoId: string | null = null;
    if (parsed.hostname === "youtu.be" || parsed.hostname.endsWith(".youtu.be")) {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtube-nocookie.com")) {
      videoId = parsed.searchParams.get("v") ?? parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ?? null;
    }
    return videoId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` : null;
  } catch {
    return null;
  }
}

function useCoursewareViewState({ darkMode: requestedDarkMode, serverState }: CoursewareViewProps) {
  const { studentId, topicId } = useParams<{ studentId: string; topicId: string }>();
  const navigate = useNavigate();
  const theme = useOutletContext<AdminThemeContext | undefined>();
  const darkMode = requestedDarkMode ?? theme?.darkMode ?? false;
  const view = `courseware:${studentId}:${topicId}`;

  const [localData, setData] = useState<CoursewareResource | null>(null);
  const data=serverState?serverState.data??null:localData;
  const [localLoading, setLoading] = useState(true);
  const loading=serverState?.loading??localLoading;
  const [localError, setError] = useState<string | null>(null);
  const error=serverState?.error??localError;
  const [localSelectedVideo, setSelectedVideo] = useState<CoursewareResource["videos"][number] | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [marked,setMarked] = useState<Set<string>>(()=>new Set());
  const [showAllVideos,setShowAllVideos] = useState(false);
  const [activeStep,setActiveStep] = useState("explore");
  function toggleObjective(key:string) {setMarked(previous=>{const next=new Set(previous);if(next.has(key))next.delete(key);else next.add(key);return next;});}
  function scrollToSection(section:string) {
    setActiveStep(section);
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.document.getElementById(`${view}:${section}`)?.scrollIntoView({behavior:reduced?"instant":"smooth",block:"start"});
  }
  const selectedVideo=serverState?.denied?null:localSelectedVideo;

  const videos = data ? dedupeVideos(data.videos) : [];

  const reserved = data;
  const reservedDocument = reserved?.document ?? { title: "", content: Array.from({ length: skeletonRows(`${view}:paragraphs`, undefined, 220) }, () => "paragraph").join("\n\n"), generatedAt: null };
  const reservedVideos = reserved ? dedupeVideos(reserved.videos).slice(0, skeletonRows(`${view}:videos`, undefined, 260)) : Array.from({ length: skeletonRows(`${view}:videos`, undefined, 260) }, (_, index) => ({ title: "", channelName: "", url: String(index), thumbnailUrl: "" }));
  const renderResources = (pending: boolean, headerOnly = false) => {
    const document = pending ? reservedDocument : data?.document;
    const displayVideos = pending ? reservedVideos : videos;
    const visibleVideos=pending||showAllVideos?displayVideos:displayVideos.slice(0,2);
    return <div className="sq-container">
      <header data-sk-region="learning-page-header" className="sq-page-header">
       <button type="button" onClick={()=>navigate(-1)} aria-label="Back" className="sq-back sq-action"><ArrowLeft size={26}/></button>
       <div className="min-w-0"><p className="sq-eyebrow" data-sk-static="">Study Quest</p><h1 data-type-exempt="true" data-sk-variable="" data-sk-region="learning-title" data-sk-field={`${view}:title`}>{pending?<SkeletonParagraph field={`${view}:title`} typical={2}/>:document?.title??"Learning resources"}</h1></div>
      </header>
      {!headerOnly&&<div className="sq-content" data-sk-region="coursewareview-div-field-7">
       {(pending||data)&&<>
        <section className="sq-chalkboard sk-surface-brand" data-sk-region="learning-quest" data-sk-variable="">
         <span aria-hidden="true" className="sq-chalk-doodle"><Pencil/><BookOpen/></span>
         <span className="sq-quest-label"><Compass size={18}/>Your learning quest</span>
         <h2 data-sk-variable="" data-sk-region="learning-quest-title" data-sk-field={`${view}:quest-title`}>Ready to explore {pending?<SkeletonParagraph field={`${view}:quest-title`} typical={2} inline/>:document?.title}?</h2>
         <p>Follow the lesson, then watch a video to complete your learning path.</p>
         <div className="sq-hero-actions"><button type="button" className="sq-action sq-explore" disabled={pending} onClick={()=>scrollToSection("explore")}><Pencil size={28}/>Explore the lesson</button><button type="button" className="sq-action sq-watch" disabled={pending||!displayVideos.length} onClick={()=>scrollToSection("watch")}><MonitorPlay size={28}/>Watch and learn</button></div>
         <div className="sq-chalk-tray" aria-hidden="true"><span/><span/><span/></div>
        </section>
        <nav className="sq-path" aria-label="Your learning path">
         <button type="button" disabled={pending} aria-current={activeStep==="explore"?"step":undefined} onClick={()=>scrollToSection("explore")}><span><BookOpen/></span>Explore</button>
         <button type="button" disabled={pending||!displayVideos.length} aria-current={activeStep==="watch"?"step":undefined} onClick={()=>scrollToSection("watch")}><span><MonitorPlay/></span>Watch</button>
         <button type="button" disabled={pending} onClick={()=>navigate(`/parent/students/${studentId}/topics/${topicId}/quiz`)}><span><Apple/></span>Quiz</button>
        </nav>
        <div id={`${view}:explore`} className="sq-lessons" data-sk-region="lesson-body" data-sk-variable="">{renderLesson(document?.content??"",pending,view,marked,toggleObjective)}</div>
        {(pending||data?.warning)&&<div className="sq-warning" data-sk-region="learning-warning" data-sk-variable=""><AlertTriangle size={20}/><p data-sk-field={`${view}:warning`}>{pending?<SkeletonParagraph field={`${view}:warning`} typical={2} width="100%"/>:data?.warning}</p></div>}
        {displayVideos.length>0&&<section id={`${view}:watch`} className="sq-corkboard" data-sk-region="learning-videos" data-sk-variable="">
         <div className="sq-video-heading"><h2>Watch and learn</h2><span>{pending?<SkeletonText width="2ch"/>:displayVideos.length} videos</span></div>
         {selectedVideo&&!pending&&<div className="sq-player">
          {getYouTubeEmbedUrl(selectedVideo.url)?<div className="aspect-video bg-black"><iframe className="h-full w-full" src={`${getYouTubeEmbedUrl(selectedVideo.url)}?autoplay=1&rel=0`} title={selectedVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>:<p>This video cannot play in the page. <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer">Open it in a new tab</a>.</p>}
          <div className="sq-player-caption"><p>{selectedVideo.title}</p><button type="button" className="sq-action" onClick={()=>setSelectedVideo(null)} data-sk-region="coursewareview-close">Close</button></div>
         </div>}
         <div className="sq-video-grid">{visibleVideos.map((video,index)=><article key={`${video.url}-${index}`} className="sq-video-card">
          <span className="sq-pin" aria-hidden="true"/>
          <button type="button" className="sq-thumbnail" data-sk-region="learning-video" disabled={pending} aria-label={`Play ${video.title}`} onClick={()=>{setSelectedVideo(video);setActiveStep("watch");scrollToSection("watch");}}>
           <div className="sq-thumbnail-fallback" aria-hidden="true"><BookOpen size={64}/><span>Let's learn!</span></div>
           {pending?<SkeletonImage aspectRatio="16 / 9" className="h-full w-full rounded-none"/>:<img src={video.thumbnailUrl} alt="" loading="lazy" className="sq-video-image" onError={event=>{event.currentTarget.style.display="none";}}/>}
           <span className="sq-play-icon"><Play fill="currentColor"/></span>
          </button>
          <div className="sq-video-caption"><h3 data-sk-field={`${view}:video:${index}`}>{pending?<SkeletonParagraph field={`${view}:video:${index}`} typical={2} width="100%"/>:video.title}</h3><p>{pending?<SkeletonText width="60%"/>:video.channelName}</p></div>
          <button type="button" className="sq-watch-button sq-action" disabled={pending} aria-label={`Watch here: ${video.title}`} onClick={()=>{setSelectedVideo(video);scrollToSection("watch");}}>Watch here</button>
         </article>)}</div>
         {!pending&&displayVideos.length>2&&<button type="button" className="sq-more-videos" aria-expanded={showAllVideos} onClick={()=>setShowAllVideos(value=>!value)}>{showAllVideos?"Show fewer videos":`+ ${displayVideos.length-2} more videos`}</button>}
        </section>}
        <div className="sq-ruler" aria-hidden="true"/>
       </>}
      </div>}
    </div>;
  };

  return { content: ((
    <div className={`study-quest ${darkMode?"sq-night":""} relative isolate -m-4 min-h-[calc(100dvh-5.8125rem)] sm:-m-6`}>
      {error && renderResources(false, true)}
      <LoadingRegion loading={loading} error={error} retry={serverState?.retry??(()=>setAttempt(value=>value+1))} variable name="learning-resources" skeleton={null} frame={renderResources} retainPrevious hasContent={!!data} initialContentKnown={!!data} onSettled={() => {
        if (!data) return;
        rememberRows(`${view}:paragraphs`, data.document.content.split('\n').filter(line => line.trim()).length);
        rememberRows(`${view}:videos`, videos.length);
      }}>{null}</LoadingRegion>
    </div>
  )), scope: { studentId, topicId, setLoading, setError, setSelectedVideo, getCourseware, setData, attempt } };
}


export type CoursewareViewEffectScope = ReturnType<typeof useCoursewareViewState>["scope"];
export type CoursewareViewRouteProps = Parameters<typeof useCoursewareViewState>[0];
export function CoursewareViewComposition(props: CoursewareViewRouteProps & { effects?: (scope: CoursewareViewEffectScope) => import("react").ReactNode }) {
 const state = useCoursewareViewState(props);
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
