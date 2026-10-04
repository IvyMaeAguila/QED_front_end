import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Play, ListChecks, Users, Sparkles, Compass, BookOpen, Pencil, Lightbulb, Calculator } from "lucide-react";
import { getCourseware } from "./service/courseware.service";
import type { CoursewareResource } from "./service/courseware.service";



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
function renderMarkdownLite(content: string, textSecondary: string, darkMode: boolean) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  function flushBullets(key: string) {
    if (bulletBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="my-2 space-y-2 pl-0">
        {bulletBuffer.map((b, i) => (
          <li key={i} className={`flex gap-2.5 text-[15px] leading-relaxed ${textSecondary}`}>
            <span
              className="mt-2.25 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B0D0D]"
            />
            <span>{b}</span>
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
          className={`mt-5 mb-3 flex items-center justify-between gap-3 rounded-xl2 py-3 pl-4 pr-3 first:mt-0 ${darkMode ? "bg-[#43252A]" : "bg-[#7A1128]"}`}
        >
          <h3 className="font-sans text-[15px] font-semibold tracking-tight text-[#FBEFD9]">
            {label}
          </h3>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Icon size={16} className="text-white" strokeWidth={2.25} />
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
        <p key={i} className={`text-[15px] leading-relaxed ${textSecondary}`}>
          {trimmed}
        </p>
      );
    }
  });
  flushBullets("bul-end");

  return blocks;
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-current/10 ${className}`} />;
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

export default function CoursewareView({ darkMode = false }: CoursewareViewProps) {
  const { studentId, topicId } = useParams<{ studentId: string; topicId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<CoursewareResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<CoursewareResource["videos"][number] | null>(null);

  const pageBg = darkMode ? "bg-[#17222a]" : "bg-[#fbffff]";
  const panelBg = darkMode ? "bg-[#2A1A18]" : "bg-white";
  const panelBorder = darkMode ? "border-[#543632]" : "border-[#E5E7EB]";
  const textSecondary = darkMode ? "text-[#D1C4C1]" : "text-[#596273]";
  const headingColor = darkMode ? "text-white" : "text-[#111827]";
  const errBg = darkMode ? "bg-[#4A2A0A]/40" : "bg-[#FCF3D9]";
  const errText = darkMode ? "text-[#F0D96C]" : "text-[#8A6600]";

  useEffect(() => {
    if (!studentId || !topicId) return;
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      setData(null);
      setSelectedVideo(null);
      try {
        const result = await getCourseware(studentId!, topicId!);
        if (isMounted) setData(result);
      } catch (err) {
        console.error("Failed to load courseware:", err);
        if (isMounted) setError("We couldn't generate learning resources right now. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [studentId, topicId]);

  const videos = data ? dedupeVideos(data.videos) : [];

  return (
    <div className={`relative isolate -m-4 min-h-[calc(100dvh-5.8125rem)] overflow-hidden sm:-m-6 ${pageBg}`}>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-10 ${darkMode ? "opacity-35" : "opacity-80"}`}
        style={{
          backgroundImage: darkMode
            ? "linear-gradient(rgba(121, 190, 190, 0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(121, 190, 190, 0.10) 1px, transparent 1px), radial-gradient(ellipse at 50% 0%, rgba(44, 109, 130, 0.35), transparent 68%)"
            : "linear-gradient(rgba(71, 190, 202, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(71, 190, 202, 0.18) 1px, transparent 1px), radial-gradient(ellipse at 50% 0%, rgba(222, 250, 247, 0.72), transparent 72%)",
          backgroundSize: "24px 24px, 24px 24px, 100% 100%",
        }}
      />
      {!darkMode && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-20 z-0 h-24 overflow-hidden">
          <div className="absolute -left-5 -top-10 flex -rotate-6 items-center gap-6 text-[#df705b]/75 sm:left-6">
            <BookOpen size={46} strokeWidth={1.8} />
            <Pencil size={38} strokeWidth={1.8} className="rotate-45 text-[#e5ab36]" />
            <Lightbulb size={42} strokeWidth={1.8} className="text-[#e5ab36]" />
          </div>
          <div className="absolute -right-3 -top-8 flex rotate-6 items-center gap-6 text-[#4589b5]/70 sm:right-8">
            <Calculator size={40} strokeWidth={1.8} />
            <Pencil size={42} strokeWidth={1.8} className="-rotate-12 text-[#df705b]" />
            <BookOpen size={44} strokeWidth={1.8} className="text-[#4589b5]" />
          </div>
        </div>
      )}
      <div
        className={`relative z-10 flex items-center gap-3 border-b px-5 py-4 ${
          darkMode ? "border-[#38505a] bg-[#17222a]/95" : "border-[#cfe9e8] bg-white/90"
        }`}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className={`system-back-button flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            darkMode
              ? "text-[#F0D96C] hover:bg-white/5"
              : "text-[#7A1128] hover:bg-[#7A1128]/5"
          }`}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-rose-200" : "text-[#8B0D0D]"}`}>Study Quest</p>
          <h1 className={`truncate font-sans text-[17px] font-semibold tracking-tight ${headingColor}`}>
            {data?.document.title ?? "Learning resources"}
          </h1>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col gap-5 px-4 pb-10 pt-5 sm:px-8 lg:px-10">
        {loading ? (
          <>
            <div className={`rounded-3xl border p-4 ${panelBorder} ${panelBg} ${textSecondary}`}>
              <SkeletonBlock className="mb-3 h-4 w-2/3" />
              <SkeletonBlock className="mb-2 h-3 w-full" />
              <SkeletonBlock className="mb-2 h-3 w-5/6" />
              <SkeletonBlock className="h-3 w-3/4" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className={`overflow-hidden rounded-3xl border ${panelBorder} ${panelBg} ${textSecondary}`}>
                  <SkeletonBlock className="h-32 w-full rounded-none" />
                  <div className="p-3">
                    <SkeletonBlock className="mb-2 h-3 w-4/5" />
                    <SkeletonBlock className="h-3 w-2/5" />
                  </div>
                </div>
              ))}
            </div>
            <p className={`text-center text-[13px] ${textSecondary}`}>
              Generating learning resources for this topic&hellip;
            </p>
          </>
        ) : error ? (
          <div className={`flex items-start gap-2.5 rounded-3xl px-4 py-3.5 ${errBg}`}>
            <AlertTriangle size={18} className={`mt-0.5 shrink-0 ${errText}`} />
            <p className={`text-sm font-medium leading-snug ${errText}`}>{error}</p>
          </div>
        ) : data ? (
          <>
            <section className={`relative overflow-hidden rounded-xl2 border p-5 sm:p-6 ${panelBorder} ${darkMode ? "bg-[#3A201D]" : "bg-[#800000]"}`}>
              <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full border-[18px] border-white/10" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    <Compass size={13} /> Your learning quest
                  </span>
                  <h2 className="mt-3 text-xl font-extrabold text-white sm:text-2xl">Ready to explore {data.document.title}?</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75">Follow the lesson, then watch a video to complete your learning path.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:min-w-64 sm:grid-cols-1">
                  {["Explore the lesson", "Watch and learn"].map((step, index) => (
                    <div key={step} className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/10 px-3 py-2 text-xs font-semibold text-white">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#800000]">
                        {index === 0 ? <ListChecks size={14} /> : <Play size={13} fill="currentColor" />}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {renderMarkdownLite(data.document.content, textSecondary, darkMode)}

            {data.warning && (
              <div className={`flex items-start gap-2.5 rounded-xl2 px-4 py-3.5 ${errBg}`}>
                <AlertTriangle size={18} className={`mt-0.5 shrink-0 ${errText}`} />
                <p className={`text-sm font-medium leading-snug ${errText}`}>{data.warning}</p>
              </div>
            )}

            {videos.length > 0 && (
              <div>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h2 className={`text-lg font-bold ${headingColor}`}>Watch and learn</h2>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${darkMode ? "bg-white/10 text-white/75" : "bg-white text-[#596273]"}`}>{videos.length} videos</span>
                </div>
                {selectedVideo && (
                  <div className={`mb-4 overflow-hidden rounded-xl2 border ${panelBorder} ${panelBg}`}>
                    {getYouTubeEmbedUrl(selectedVideo.url) ? (
                      <div className="aspect-video bg-black">
                        <iframe
                          className="h-full w-full"
                          src={`${getYouTubeEmbedUrl(selectedVideo.url)}?autoplay=1&rel=0`}
                          title={selectedVideo.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className={`p-4 text-sm ${textSecondary}`}>
                        This video cannot play in the page. <a className="font-semibold text-[#8B0D0D] underline" href={selectedVideo.url} target="_blank" rel="noopener noreferrer">Open it in a new tab</a>.
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-semibold ${headingColor}`}>{selectedVideo.title}</p>
                        <p className={`text-xs ${textSecondary}`}>{selectedVideo.channelName}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedVideo(null)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${darkMode ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Close</button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {videos.map((v, i) => (
                    <button
                      key={`${v.url}-${i}`}
                      type="button"
                      onClick={() => setSelectedVideo(v)}
                      className={`group relative block overflow-hidden rounded-xl2 border text-left transition-transform duration-100 active:translate-y-0.5 ${panelBorder} ${panelBg}`}
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-black/10">
                        <img src={v.thumbnailUrl} alt={v.title} className="h-full w-full object-cover" />
                        {/* Maroon scrim so overlaid text stays legible on any thumbnail */}
                        <div className="absolute inset-0 bg-linear-to-t from-[#2B0D14]/95 via-[#2B0D14]/10 to-transparent" />

                        <div className="absolute inset-x-0 bottom-0 p-3 pr-14">
                          <p className="line-clamp-2 text-[13.5px] font-medium leading-snug text-white">
                            {v.title}
                          </p>
                          <p className="mt-0.5 text-xs text-[#EADFC7]">{v.channelName}</p>
                        </div>

                        <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#800000] shadow-md ring-2 ring-white/80 transition-transform group-hover:scale-105 group-active:scale-90">
                          <Play size={16} className="ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                        <p className={`line-clamp-1 text-xs font-semibold ${headingColor}`}>{v.title}</p>
                        <span className="shrink-0 text-[10px] font-bold text-[#8B0D0D]">Watch here</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
