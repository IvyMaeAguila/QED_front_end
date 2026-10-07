import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CirclePlay } from "lucide-react";
import petHungry from "../../profiles/parent/pages/Student/Academic/components/assets/pet-hungry.png";
import petHappy from "../../profiles/parent/pages/Student/Academic/components/assets/pet-happy.png";
import { Reveal } from "./Reveal";

const SLIDES = [
  {
    eyebrow: "01 · The signal",
    title: "A low topic score starts support.",
    description: "When a student needs help with a specific topic, QED focuses the intervention on that learning gap.",
    visual: "signal",
  },
  {
    eyebrow: "02 · Relearn",
    title: "Start with a video about that topic.",
    description: "The student can revisit the lesson with a related video before moving on to guided practice.",
    visual: "video",
  },
  {
    eyebrow: "03 · Quiz roadmap",
    title: "Build confidence one level at a time.",
    description: "The quiz progresses from Easy to Medium to Hard, followed by Matching and Memory rounds.",
    visual: "roadmap",
  },
  {
    eyebrow: "04 · Five-day practice",
    title: "Return to the skill across five days.",
    description: "Short practice sessions help the student revisit the same topic and strengthen understanding over time.",
    visual: "days",
  },
  {
    eyebrow: "05 · Meet ED",
    title: "A little learning companion with a journey of his own.",
    description: "ED was travelling across the universe when his spaceship lost power and he became stranded on Earth. Correct quiz answers recharge his ship and help him find his way home.",
    visual: "story",
  },
] as const;

function SlideVisual({ visual }: { visual: (typeof SLIDES)[number]["visual"] }) {
  if (visual === "signal") {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl bg-[#F4F2F0] p-6 text-center">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#800000]">Topic needs review</span>
        <img src={petHungry} alt="ED waiting for help" className="mt-2 h-36 w-36 object-contain sm:h-40 sm:w-40" />
        <p className="text-sm font-semibold text-[#241B1C]">Fractions on a number line</p>
        <p className="mt-1 text-xs text-[#817777]">A focused intervention begins</p>
      </div>
    );
  }

  if (visual === "video") {
    return (
      <div className="flex min-h-[280px] flex-col justify-center rounded-2xl bg-[#F4F2F0] p-5 sm:p-7">
        <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border border-[#E2DDD8] bg-white text-[#800000]">
          <CirclePlay size={42} strokeWidth={1.5} />
          <span className="text-xs font-semibold">Related topic video</span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-[#241B1C]">Fractions on a number line</span>
          <span className="text-[#817777]">Relearn at your pace</span>
        </div>
      </div>
    );
  }

  if (visual === "roadmap") {
    return (
      <div className="flex min-h-[280px] flex-col justify-center rounded-2xl bg-[#F4F2F0] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#800000]">Quiz progression</p>
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {(["Easy", "Medium", "Hard"] as const).map((level, index) => (
            <div key={level} className="relative rounded-xl border border-[#E2DDD8] bg-white px-2 py-4 text-center">
              <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#F2EEEE] text-xs font-semibold text-[#800000]">{index + 1}</span>
              <p className="mt-2 text-sm font-semibold text-[#241B1C]">{level}</p>
              {index < 2 && <span aria-hidden="true" className="absolute -right-2.5 top-1/2 z-10 hidden h-px w-3 bg-[#C9B7B7] sm:block" />}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-[#D8CECA] bg-white/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#817777]">Then complete the bonus rounds</p>
          <div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full bg-[#F2EEEE] px-3 py-1.5 text-xs font-medium text-[#650000]">Matching</span><span className="rounded-full bg-[#F2EEEE] px-3 py-1.5 text-xs font-medium text-[#650000]">Memory</span></div>
        </div>
      </div>
    );
  }

  if (visual === "days") {
    return (
      <div className="flex min-h-[280px] flex-col justify-center rounded-2xl bg-[#F4F2F0] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#800000]">One topic · five practice days</p>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="rounded-xl border border-[#E2DDD8] bg-white px-1 py-4 text-center">
              <span className="block text-xs font-medium uppercase tracking-wide text-[#817777]">Day</span>
              <span className="mt-1 block text-xl font-semibold tabular-nums text-[#650000]">{index + 1}</span>
              <span className="mt-1 block text-xs text-[#62595A]">Practice</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-[#62595A]">Small, focused steps bring the learner back to the same skill each day.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl bg-[#F4F2F0] p-5 text-center sm:p-7">
      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#800000]">ED’s story</span>
      <img src={petHappy} alt="ED recharged and ready to continue his journey" className="h-40 w-40 object-contain" />
      <blockquote className="max-w-md text-sm leading-6 text-[#62595A]">“I got lost when my spaceship ran out of energy. Every correct answer helps me recharge and find my way home.”</blockquote>
    </div>
  );
}

export const InterventionSection = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slide = SLIDES[activeSlide];
  const goToSlide = (index: number) => setActiveSlide((index + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % SLIDES.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <section id="intervention" className="bg-[#F5F4F1] px-4 py-14 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#800000]">QED intervention · A guided journey</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight text-[#211819] sm:text-4xl">From a learning gap to a fresh start.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#62595A]">See how a topic video, a staged quiz, five days of practice, and ED’s story fit together.</p>
        </Reveal>

        <Reveal delay={80}>
          <div
            className="landing-polygon-surface overflow-hidden rounded-3xl border border-[#E0E4E9] bg-white shadow-[0_10px_30px_rgba(31,41,55,0.07)]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false);
            }}
            aria-roledescription="carousel"
            aria-label="QED intervention process"
          >
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#800000]">{slide.eyebrow}</p>
                  <h3 className="mt-4 max-w-lg text-2xl font-semibold leading-tight text-[#211819] sm:text-3xl">{slide.title}</h3>
                  <p className="mt-4 max-w-lg text-sm leading-7 text-[#62595A] sm:text-base">{slide.description}</p>
                </div>
                <div className="mt-8 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-2" role="group" aria-label="Choose intervention slide">
                    {SLIDES.map((item, index) => (
                      <button key={item.eyebrow} type="button" onClick={() => goToSlide(index)} aria-label={`Go to slide ${index + 1}: ${item.eyebrow}`} aria-current={activeSlide === index ? "step" : undefined} className={`h-2.5 rounded-full transition-all ${activeSlide === index ? "w-8 bg-[#800000]" : "w-2.5 bg-[#D8DCE2] hover:bg-[#B78A8A]"}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="mr-1 text-xs tabular-nums text-[#817777]">{String(activeSlide + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}</span>
                    <button type="button" onClick={() => goToSlide(activeSlide - 1)} aria-label="Previous slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DDE1E6] text-[#650000] transition-colors hover:bg-[#F5F4F1]"><ArrowLeft size={17} /></button>
                    <button type="button" onClick={() => goToSlide(activeSlide + 1)} aria-label="Next slide" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#800000] text-white transition-colors hover:bg-[#650000]"><ArrowRight size={17} /></button>
                  </div>
                </div>
              </div>
              <div className="border-t border-[#E8E4DE] p-4 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
                <SlideVisual visual={slide.visual} />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
