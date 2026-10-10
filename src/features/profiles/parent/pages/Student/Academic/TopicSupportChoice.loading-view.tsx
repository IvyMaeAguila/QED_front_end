import { ArrowLeft,BookOpen,Flame,Gamepad2,Sparkles,Star } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import QuestWorldBackground from "./components/QuestWorldBackground";

function useTopicSupportChoiceState() {
  const { studentId, topicId } = useParams<{ studentId: string; topicId: string }>();
  const navigate = useNavigate();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();

  const backBtn = darkMode
    ? "text-gray-200 hover:bg-gray-800"
    : "text-gray-700 hover:bg-gray-100";

  function goBackToAcademicTab() {
    navigate(`/parent/students/${studentId}`);
  }

  function goToLearn() {
    navigate(`/parent/students/${studentId}/topics/${topicId}/courseware`);
  }

  function goToQuiz() {
    navigate(`/parent/students/${studentId}/topics/${topicId}/quiz`);
  }

  return { content: ((
    <div data-sk-region="topic-support-content" className="relative isolate -m-4 min-h-[calc(100dvh-5.8125rem)] sm:-m-6">
      <QuestWorldBackground darkMode={darkMode} />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-6 flex items-center gap-1">
        <button
          type="button"
          onClick={goBackToAcademicTab}
          aria-label="Back to academic support"
          className={`system-back-button -ml-1 flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-90 ${backBtn}`}
        >
          <ArrowLeft size={18} />
        </button>
        <span className={`text-base font-black ${textPrimary}`}>Quest Board</span>
      </div>

      <div className="flex w-full flex-col items-stretch gap-6 sm:gap-7">

        <div
          className={`relative w-full overflow-hidden rounded-3xl px-5 py-6 text-center sm:py-8 ${
            darkMode
              ? "bg-panel-dark shadow-[0_6px_0_0_#000000]"
              : "bg-maroon shadow-[0_6px_0_0_var(--brand-primary)]"
          }`}
        >
          <Sparkles
            size={64}
            className="qsb-float pointer-events-none absolute -right-3 -top-3 text-white/15 sm:h-20 sm:w-20"
          />
          <Star
            size={40}
            className="qsb-float-slow pointer-events-none absolute -bottom-2 left-4 text-white/15"
          />
          <p className="text-xs font-black uppercase tracking-wide text-white/80">
            Pick your path
          </p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            How do we help today?
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm font-semibold text-white/70 sm:max-w-sm">
            Choose a quest to support your child with this topic.
          </p>
        </div>

        {/* quest cards */}
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
          <QuestCard
            onClick={goToLearn}
            icon={BookOpen}
            eyebrow="Study Quest"
            title="Learn"
            description="A reviewer and curated videos for this topic"
            colors={{
              face: "bg-maroon",
              edge: "var(--brand-primary)",
              badgeBg: "bg-maroon",
              iconRing: "ring-maroon/20",
            }}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />

          <QuestCard
            onClick={goToQuiz}
            icon={Gamepad2}
            eyebrow="Feed Your Pet"
            title="Quiz"
            description="A gamified quiz for this topic — feed your pet by answering correctly!"
            colors={{
              face: "bg-maroon-light",
              edge: "var(--brand-secondary)",
              badgeBg: "bg-maroon-light",
              iconRing: "ring-maroon/20",
            }}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            decoration={<Flame size={16} className="text-amber-500" />}
          />
        </div>
      </div>
      </div>

      <style>{`
        @keyframes qsbFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-6px) rotate(6deg); }
        }
        .qsb-float { animation: qsbFloat 3s ease-in-out infinite; }
        .qsb-float-slow { animation: qsbFloat 4.5s ease-in-out infinite; animation-delay: 0.5s; }

        @media (prefers-reduced-motion: reduce) {
          .qsb-float, .qsb-float-slow { animation: none !important; }
        }
      `}</style>
    </div>
  )), scope: {  } };
}


function QuestCard({
  onClick,
  icon: Icon,
  eyebrow,
  title,
  description,
  colors,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  decoration,
}: {
  onClick: () => void;
  icon: typeof BookOpen;
  eyebrow: string;
  title: string;
  description: string;
  colors: { face: string; edge: string; badgeBg: string; iconRing: string };
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  decoration?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ boxShadow: `0 6px 0 0 ${colors.edge}` }}
      className={`group relative flex flex-col items-start gap-3 rounded-3xl border p-5 text-left transition-transform active:translate-y-1 sm:p-6 ${panelBg} ${panelBorder}`}
      onMouseDown={(e) => {
        e.currentTarget.style.boxShadow = `0 2px 0 0 ${colors.edge}`;
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.boxShadow = `0 6px 0 0 ${colors.edge}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 6px 0 0 ${colors.edge}`;
      }}
    >
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide text-white ${colors.badgeBg}`}
      >
        {eyebrow}
      </span>

      <div className="flex items-center gap-3.5">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-inner ring-4 ${colors.face} ${colors.iconRing} transition-transform group-active:scale-90`}
        >
          <Icon size={26} strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className={`text-lg font-black ${textPrimary}`}>{title}</p>
          {decoration && <div className="mt-0.5 flex items-center gap-1">{decoration}</div>}
        </div>
      </div>

      <p className={`text-sm font-medium leading-snug ${textMuted}`}>{description}</p>
    </button>
  );
}


export type TopicSupportChoiceEffectScope = ReturnType<typeof useTopicSupportChoiceState>["scope"];
export type TopicSupportChoiceRouteProps = Record<string, never>;
export function TopicSupportChoiceComposition(props: object & { effects?: (scope: TopicSupportChoiceEffectScope) => import("react").ReactNode }) {
 const state = useTopicSupportChoiceState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
