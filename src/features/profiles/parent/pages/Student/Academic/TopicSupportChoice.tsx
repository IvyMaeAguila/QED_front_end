import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { BookOpen, Gamepad2, ChevronLeft, Sparkles, Star, Flame } from "lucide-react";
import type { ReactNode } from "react";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";

export default function TopicSupportChoice() {
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

  return (
    <div>

      <div className="mb-6 flex items-center gap-1">
        <button
          type="button"
          onClick={goBackToAcademicTab}
          aria-label="Back to academic support"
          className={`-ml-1 flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-90 ${backBtn}`}
        >
          <ChevronLeft size={22} />
        </button>
        <span className={`text-[15px] font-black ${textPrimary}`}>Quest Board</span>
      </div>

      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 sm:max-w-2xl sm:gap-8 lg:max-w-4xl">

        <div
          className={`relative w-full overflow-hidden rounded-3xl px-5 py-6 text-center sm:py-8 ${
            darkMode
              ? "bg-linear-to-b from-[#1F2937] to-[#0B1120] shadow-[0_6px_0_0_#000000]"
              : "bg-linear-to-b from-[#7A0000] to-[#4A0000] shadow-[0_6px_0_0_#2E0000]"
          }`}
        >
          <Sparkles
            size={64}
            className="qsb-float pointer-events-none absolute -right-3 -top-3 text-[#C98A2B]/20 sm:h-20 sm:w-20"
          />
          <Star
            size={40}
            className="qsb-float-slow pointer-events-none absolute -bottom-2 left-4 text-[#C98A2B]/15"
          />
          <p className="text-xs font-black uppercase tracking-wide text-[#E8C27E]">
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
              face: "from-sky-400 to-sky-500",
              edge: "#0369a1",
              badgeBg: "bg-sky-600",
              iconRing: "ring-sky-200",
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
              face: "from-amber-400 to-amber-500",
              edge: "#b45309",
              badgeBg: "bg-amber-600",
              iconRing: "ring-amber-200",
            }}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            decoration={<Flame size={16} className="text-amber-500" />}
          />
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
  );
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
        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white ${colors.badgeBg}`}
      >
        {eyebrow}
      </span>

      <div className="flex items-center gap-3.5">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-b text-white shadow-inner ring-4 ${colors.face} ${colors.iconRing} transition-transform group-active:scale-90`}
        >
          <Icon size={26} strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className={`text-lg font-black ${textPrimary}`}>{title}</p>
          {decoration && <div className="mt-0.5 flex items-center gap-1">{decoration}</div>}
        </div>
      </div>

      <p className={`text-[13px] font-medium leading-snug ${textMuted}`}>{description}</p>
    </button>
  );
}