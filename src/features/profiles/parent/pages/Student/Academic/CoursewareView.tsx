import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, AlertTriangle, Play, ListChecks, Users, Sparkles } from "lucide-react";
import { getCourseware } from "./service/courseware.service";
import type { CoursewareResource } from "./service/courseware.service";



interface CoursewareViewProps {
  darkMode?: boolean;
}

// Metallic gold gradient used for the play badge and small accent fills.
const GOLD_GRADIENT = "linear-gradient(135deg, #F9E37A 0%, #C28F1A 55%, #F6E073 100%)";

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
function renderMarkdownLite(content: string, textSecondary: string) {
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
              className="mt-2.25 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: GOLD_GRADIENT }}
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
          className="mt-5 mb-3 flex items-center justify-between gap-3 rounded-2xl py-3 pl-4 pr-3 first:mt-0"
          style={{
            background: "linear-gradient(135deg, #8A1B34 0%, #6B1220 55%, #5C0E1F 100%)",
            boxShadow: "0 4px 0 0 #3A0D19",
          }}
        >
          <h3 className="font-serif text-[15px] font-semibold tracking-tight text-[#FBEFD9]">
            {label}
          </h3>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: GOLD_GRADIENT }}
          >
            <Icon size={16} className="text-[#3A0D19]" strokeWidth={2.25} />
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

export default function CoursewareView({ darkMode = false }: CoursewareViewProps) {
  const { studentId, topicId } = useParams<{ studentId: string; topicId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<CoursewareResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageBg = darkMode ? "bg-[#210810]" : "bg-[#FAF6EE]";
  const panelBg = darkMode ? "bg-[#3A0D19]" : "bg-white";
  const panelBorder = darkMode ? "border-[#5C0E1F]" : "border-[#EADFC7]";
  const textSecondary = darkMode ? "text-[#D9C3A9]" : "text-[#6B5B54]";
  const headingColor = darkMode ? "text-[#F0D96C]" : "text-[#7A1128]";
  const errBg = darkMode ? "bg-[#4A2A0A]/40" : "bg-[#FCF3D9]";
  const errText = darkMode ? "text-[#F0D96C]" : "text-[#8A6600]";

  useEffect(() => {
    if (!studentId || !topicId) return;
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      setData(null);
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
    <div className={`min-h-screen ${pageBg}`}>
      <div
        className={`flex items-center gap-3 border-b px-5 py-4 ${
          darkMode ? "border-[#5C0E1F] bg-[#210810]" : "border-[#EADFC7] bg-[#FAF6EE]"
        }`}
        style={{ boxShadow: darkMode ? "none" : "0 1px 0 0 #C28F1A33" }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            darkMode
              ? "text-[#F0D96C] hover:bg-white/5"
              : "text-[#7A1128] hover:bg-[#7A1128]/5"
          }`}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className={`font-serif text-[17px] font-semibold tracking-tight ${headingColor}`}>
          {data?.document.title ?? "Learning resources"}
        </h1>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pb-10 pt-4">
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
            <div
              className={`relative overflow-hidden rounded-3xl border p-4 ${panelBorder} ${panelBg}`}
              style={{ boxShadow: darkMode ? "none" : "0 3px 0 0 #EADFC7" }}
            >
              {renderMarkdownLite(data.document.content, textSecondary)}
            </div>

            {data.warning && (
              <div className={`flex items-start gap-2.5 rounded-3xl px-4 py-3.5 ${errBg}`}>
                <AlertTriangle size={18} className={`mt-0.5 shrink-0 ${errText}`} />
                <p className={`text-sm font-medium leading-snug ${errText}`}>{data.warning}</p>
              </div>
            )}

            {videos.length > 0 && (
              <div>
                <div
                  className="mb-3 flex items-center justify-between gap-3 rounded-2xl py-3 pl-4 pr-3"
                  style={{
                    background: "linear-gradient(135deg, #8A1B34 0%, #6B1220 55%, #5C0E1F 100%)",
                    boxShadow: "0 4px 0 0 #3A0D19",
                  }}
                >
                  <h2 className="font-serif text-[15px] font-semibold tracking-tight text-[#FBEFD9]">
                    Suggested videos
                  </h2>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ background: GOLD_GRADIENT }}
                  >
                    <Play size={15} className="ml-0.5 text-[#3A0D19]" fill="#3A0D19" />
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {videos.map((v, i) => (
                    <a
                      key={`${v.url}-${i}`}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block overflow-hidden rounded-3xl transition-transform duration-100 active:translate-y-0.5"
                      style={{ boxShadow: "0 4px 0 0 rgba(43,13,20,0.35)" }}
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

                        <div
                          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-white/80 transition-transform group-active:scale-90"
                          style={{
                            background: GOLD_GRADIENT,
                            boxShadow: "0 0 0 4px rgba(249,227,122,0.35), 0 0 0 8px rgba(249,227,122,0.15)",
                          }}
                        >
                          <Play size={16} className="ml-0.5 text-[#3A0D19]" fill="#3A0D19" />
                        </div>
                      </div>
                    </a>
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