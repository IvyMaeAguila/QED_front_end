import { AlertTriangle,ArrowLeft,BookOpen,Calculator,Compass,Lightbulb,ListChecks,Pencil,Play,Sparkles,Users } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { Skeleton,SkeletonImage,SkeletonText } from "../../../../../../shared/components/SkeletonLoading";
import { LoadingRegion } from "../../../../../../shared/loading/LoadingRegion";
import { rememberRows,skeletonRows } from "../../../../../../shared/loading/reservations";
import { SkeletonParagraph } from "../../../../../../shared/loading/SkeletonParagraph";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { CoursewareResource } from "./service/courseware.service";
import { getCourseware } from "./service/courseware.service";

const resourceCache = new Map<string, CoursewareResource>();

interface CoursewareViewProps {
  darkMode?: boolean;
}

// Pick a badge icon that matches what the section is actually about,
// so the icon carries meaning instead of decorating at random.
function headingIcon(label: string) {
  const t = label.toLowerCase();
  if (t.includes("parent")) return Users;
  if (t.includes("objective")) return ListChecks;
  return Sparkles;
}

// --- Minimal markdown renderer ---------------------------------------
// The backend sends back "## Heading" / "- bullet" / blank-line-separated
// paragraphs (see courseware.controller.js documentContent). This turns
// that into real styled elements instead of a slab of raw text.
function renderMarkdownLite(content: string, textSecondary: string, darkMode: boolean, pending = false, view = "") {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  function flushBullets(key: string) {
    if (bulletBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="my-2 space-y-2 pl-0" data-sk-region="coursewareview-ul-field-1">
        {bulletBuffer.map((b, i) => (
          <li key={i} className={`flex gap-2.5 text-base leading-relaxed ${textSecondary}`}>
            <span
              className="mt-2.25 h-1.5 w-1.5 shrink-0 rounded-full bg-maroon"
            />
            <span data-sk-variable="" data-sk-region={`lesson-bullet-${key}-${i}`} data-sk-field={`${view}:bullet:${key}:${i}`}>{pending ? <SkeletonParagraph field={`${view}:bullet:${key}:${i}`} typical={3} width="100%" /> : b}</span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      flushBullets(`bul-${i}`);
      const label = trimmed.slice(3);
      const Icon = headingIcon(label);
      blocks.push(
        <div
          key={i}
          className={`mt-5 mb-3 flex items-center justify-between gap-3 rounded-xl2 py-3 pl-4 pr-3 first:mt-0 ${darkMode ? "bg-[#43252A]" : "bg-maroon"}`}
        >
          <h3 data-sk-variable="" data-sk-region={`lesson-heading-${i}`} data-sk-field={`${view}:heading:${i}`} className="font-sans text-base font-semibold tracking-tight text-[#FBEFD9]">
            {pending ? <SkeletonParagraph field={`${view}:heading:${i}`} typical={2} /> : label}
          </h3>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15" data-sk-region="coursewareview-span-field-4">
            {pending ? <Skeleton className="h-4 w-4" /> : <Icon size={16} className="text-white" strokeWidth={2.25} />}
          </span>
        </div>
      );
    } else if (trimmed.startsWith("- ")) {
      bulletBuffer.push(trimmed.slice(2));
    } else if (trimmed.length === 0) {
      flushBullets(`bul-${i}`);
    } else {
      flushBullets(`bul-${i}`);
      blocks.push(
        <p key={i} data-sk-variable="" data-sk-region={`lesson-paragraph-${i}`} data-sk-field={`${view}:paragraph:${i}`} className={`text-base leading-relaxed ${textSecondary}`}>
          {pending ? <SkeletonParagraph field={`${view}:paragraph:${i}`} typical={3} width="100%" /> : trimmed}
        </p>
      );
    }
  });
  flushBullets("bul-end");

  return pending ? blocks.slice(0, skeletonRows(`${view}:paragraphs`, undefined, 220)) : blocks;
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

function useCoursewareViewState({ darkMode: requestedDarkMode }: CoursewareViewProps) {
  const { studentId, topicId } = useParams<{ studentId: string; topicId: string }>();
  const navigate = useNavigate();
  const theme = useOutletContext<AdminThemeContext | undefined>();
  const darkMode = requestedDarkMode ?? theme?.darkMode ?? false;
  const view = `courseware:${studentId}:${topicId}`;

  const [data, setData] = useState<CoursewareResource | null>(() => resourceCache.get(view) ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<CoursewareResource["videos"][number] | null>(null);
  const [attempt, setAttempt] = useState(0);

  const pageBg = darkMode ? "bg-page-dark" : "bg-surface";
  const panelBg = darkMode ? "bg-panel-dark" : "bg-white";
  const panelBorder = darkMode ? "border-border-dark" : "border-border-subtle";
  const textSecondary = darkMode ? "text-[#D1C4C1]" : "text-[#596273]";
  const headingColor = darkMode ? "text-white" : "text-[#111827]";
  const errBg = darkMode ? "bg-[#4A2A0A]/40" : "bg-[#FCF3D9]";
  const errText = darkMode ? "text-[#F0D96C]" : "text-[#8A6600]";

  const videos = data ? dedupeVideos(data.videos) : [];

  const reserved = resourceCache.get(view);
  const reservedDocument = reserved?.document ?? { title: "", content: Array.from({ length: skeletonRows(`${view}:paragraphs`, undefined, 220) }, () => "paragraph").join("\n\n"), generatedAt: null };
  const reservedVideos = reserved ? dedupeVideos(reserved.videos).slice(0, skeletonRows(`${view}:videos`, undefined, 260)) : Array.from({ length: skeletonRows(`${view}:videos`, undefined, 260) }, (_, index) => ({ title: "", channelName: "", url: String(index), thumbnailUrl: "" }));
  const renderResources = (pending: boolean, headerOnly = false) => {
    const document = pending ? reservedDocument : data?.document;
    const displayVideos = pending ? reservedVideos : videos;
    return <>
      <div
        data-sk-region="learning-page-header"
        className={`relative z-10 flex items-center gap-3 border-b px-5 py-4 ${
          darkMode ? "border-border-subtle bg-page-dark/95" : "border-border-subtle bg-white/90"
        }`}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className={`system-back-button flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            darkMode ? "text-[#F0D96C] hover:bg-white/5" : "text-brand-ink hover:bg-maroon-light/5"
          }`}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${darkMode ? "text-rose-200" : "text-brand-ink"}`} data-sk-region="coursewareview-study-quest" data-sk-static="">Study Quest</p>
          <h1 data-sk-variable="" data-sk-region="learning-title" data-sk-field={`${view}:title`} className={`qed-type-page-title font-sans ${headingColor}`}>
            {pending ? <SkeletonParagraph field={`${view}:title`} typical={2} /> : document?.title ?? "Learning resources"}
          </h1>
        </div>
      </div>
      {!headerOnly && <div className="relative z-10 flex w-full flex-col gap-5 px-4 pb-10 pt-5 sm:px-8 lg:px-10" data-sk-region="coursewareview-div-field-7">
        {(pending || data) && <>
          <section data-sk-region="learning-quest" data-sk-variable="" className={`sk-surface-brand relative overflow-hidden rounded-xl2 border p-5 sm:p-6 ${panelBorder} ${darkMode ? "bg-[#3A201D]" : "bg-maroon"}`}>
            <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full border-[18px] border-white/10" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white" data-sk-region="coursewareview-your-learning-quest" data-sk-static="">
                  <Compass size={13} /> Your learning quest
                </span>
                <h2 data-sk-variable="" data-sk-region="learning-quest-title" data-sk-field={`${view}:quest-title`} className="mt-3 text-xl font-extrabold text-white sm:text-2xl">Ready to explore {pending ? <SkeletonParagraph field={`${view}:quest-title`} typical={2} inline /> : document?.title}?</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75" data-sk-region="coursewareview-follow-the-lesson-then-watch-a-video-to-compl" data-sk-static="">Follow the lesson, then watch a video to complete your learning path.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:min-w-64 sm:grid-cols-1">
                {["Explore the lesson", "Watch and learn"].map((step, index) => (
                  <div key={step} className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/10 px-3 py-2 text-xs font-semibold text-white">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-brand-ink">
                      {index === 0 ? <ListChecks size={14} /> : <Play size={13} fill="currentColor" />}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </section>
          <div data-sk-region="lesson-body" data-sk-variable="" className="contents">
            {renderMarkdownLite(document?.content ?? "", textSecondary, darkMode, pending, view)}
          </div>
          {(pending || data?.warning) && <div data-sk-region="learning-warning" data-sk-variable="" className={`flex items-start gap-2.5 rounded-xl2 px-4 py-3.5 ${errBg}`}>
            {pending ? <Skeleton className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-sm" /> : <AlertTriangle size={18} className={`mt-0.5 shrink-0 ${errText}`} />}
            <p data-sk-field={`${view}:warning`} className={`text-sm font-medium leading-snug ${errText}`} data-sk-region="coursewareview-p-field-10">{pending ? <SkeletonParagraph field={`${view}:warning`} typical={2} width="28ch" /> : data?.warning}</p>
          </div>}
          {displayVideos.length > 0 && <div data-sk-region="learning-videos" data-sk-variable="">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div><h2 className={`text-lg font-bold ${headingColor}`} data-sk-region="coursewareview-watch-and-learn" data-sk-static="">Watch and learn</h2></div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${darkMode ? "bg-white/10 text-white/75" : "bg-white text-[#596273]"}`} data-sk-region="coursewareview-span-field-11">{pending ? <SkeletonText width="2ch" className="inline-block" /> : displayVideos.length} videos</span>
            </div>
            {selectedVideo && !pending && (
              <div className={`mb-4 overflow-hidden rounded-xl2 border ${panelBorder} ${panelBg}`}>
                {getYouTubeEmbedUrl(selectedVideo.url) ? <div className="aspect-video bg-black"><iframe className="h-full w-full" src={`${getYouTubeEmbedUrl(selectedVideo.url)}?autoplay=1&rel=0`} title={selectedVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div> : <div className={`p-4 text-sm ${textSecondary}`}>This video cannot play in the page. <a className="font-semibold text-brand-ink underline" href={selectedVideo.url} target="_blank" rel="noopener noreferrer">Open it in a new tab</a>.</div>}
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0"><p className={`truncate text-sm font-semibold ${headingColor}`}>{selectedVideo.title}</p><p className={`text-xs ${textSecondary}`}>{selectedVideo.channelName}</p></div>
                  <button type="button" onClick={() => setSelectedVideo(null)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${darkMode ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`} data-sk-region="coursewareview-close" data-sk-static="">Close</button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-sk-region="coursewareview-div-field-12">
              {displayVideos.map((video, index) => <button data-sk-region="learning-video" data-sk-item="" key={`${video.url}-${index}`} type="button" disabled={pending} onClick={() => setSelectedVideo(video)} className={`group relative block overflow-hidden rounded-xl2 border text-left transition-transform duration-100 active:translate-y-0.5 ${panelBorder} ${panelBg}`}>
                <div data-sk-region="learning-video-image" className="relative aspect-video w-full overflow-hidden bg-black/10">
                  {pending ? <SkeletonImage aspectRatio="16 / 9" className="h-full w-full rounded-none" /> : <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />}
                  <div className="absolute inset-0 bg-(--color-courseware-video-surface)/35" />
                  <div className="sk-surface-courseware-video absolute inset-x-0 bottom-0 bg-(--color-courseware-video-surface)/95 p-3 pr-14">
                    <p data-sk-field={`${view}:video:${index}`} className="line-clamp-2 text-sm font-medium leading-snug text-white" data-sk-region="coursewareview-p-field-14">{pending ? <SkeletonParagraph field={`${view}:video:${index}`} typical={2} width="100%" /> : video.title}</p>
                    <p className="mt-0.5 text-xs text-[#EADFC7]" data-sk-region="coursewareview-p-field-15">{pending ? <SkeletonText width="60%" /> : video.channelName}</p>
                  </div>
                  <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-ink shadow-md ring-2 ring-white/80 transition-transform group-hover:scale-105 group-active:scale-90"><Play size={16} className="ml-0.5" fill="currentColor" /></div>
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2.5"><p className={`line-clamp-1 text-xs font-semibold ${headingColor}`} data-sk-region="coursewareview-p-field-16">{pending ? <SkeletonText width="14ch" /> : video.title}</p><span className="shrink-0 text-xs font-bold text-brand-ink" data-sk-region="coursewareview-watch-here" data-sk-static="">Watch here</span></div>
              </button>)}
            </div>
          </div>}
        </>}
      </div>}
    </>;
  };

  return { content: ((
    <div className={`relative isolate -m-4 min-h-[calc(100dvh-5.8125rem)] overflow-hidden sm:-m-6 ${pageBg}`}>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-10 ${darkMode ? "opacity-35" : "opacity-80"}`}
        style={{
          backgroundColor: darkMode ? "var(--surface-page-dark)" : "var(--brand-light)",
        }}
      />
      {!darkMode && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-20 z-0 h-24 overflow-hidden">
          <div className="absolute -left-5 -top-10 flex -rotate-6 items-center gap-6 text-brand-ink/75 sm:left-6">
            <BookOpen size={46} strokeWidth={1.8} />
            <Pencil size={38} strokeWidth={1.8} className="rotate-45 text-brand-ink" />
            <Lightbulb size={42} strokeWidth={1.8} className="text-brand-ink" />
          </div>
          <div className="absolute -right-3 -top-8 flex rotate-6 items-center gap-6 text-brand-ink/70 sm:right-8">
            <Calculator size={40} strokeWidth={1.8} />
            <Pencil size={42} strokeWidth={1.8} className="-rotate-12 text-brand-ink" />
            <BookOpen size={44} strokeWidth={1.8} className="text-brand-ink" />
          </div>
        </div>
      )}
      {error && renderResources(false, true)}
      <LoadingRegion loading={loading} error={error} retry={() => setAttempt(value => value + 1)} variable name="learning-resources" skeleton={null} frame={renderResources} retainPrevious hasContent={!!data} initialContentKnown={!!data} onSettled={() => {
        if (!data) return;
        resourceCache.delete(view); resourceCache.set(view, data);
        if (resourceCache.size > 128) resourceCache.delete(resourceCache.keys().next().value!);
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
