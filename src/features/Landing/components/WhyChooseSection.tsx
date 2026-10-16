import { StudentMonIcon, CircleArrowRightIcon, DataChartsIcon, UsersIcon } from "./LandingIcons";
import { Reveal } from "./Reveal";

const PILLARS = [
  {
    icon: <StudentMonIcon color="var(--color-maroon)" />,
    title: "Centralized",
    description: "All essential student and academic information is organized in one platform.",
  },
  {
    icon: <CircleArrowRightIcon color="var(--color-maroon)" />,
    title: "Efficient",
    description: "Reduce repetitive manual processes and make school information easier to manage.",
  },
  {
    icon: <DataChartsIcon color="var(--color-maroon)" />,
    title: "Insightful",
    description: "Use academic and assessment data to better understand student learning progress.",
  },
  {
    icon: <UsersIcon color="var(--color-maroon)" />,
    title: "Connected",
    description: "Support communication and information access among teachers, parents, students, and admins.",
  },
];

export const WhyChooseSection = () => {
  return (
    <section className="bg-maroon px-4 py-14 text-white sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="mb-10 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Why QED</span>
          <h2 className="mt-3 font-sans text-3xl font-semibold leading-tight text-white sm:text-4xl">One school community, working from the same picture.</h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 70} className="h-full">
              <article className="flex h-full min-h-[190px] flex-col rounded-xl border border-white/15 bg-white/[0.08] p-5 sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-ink [&_svg]:h-5 [&_svg]:w-5">{p.icon}</div>
                <h3 className="mt-6 font-sans text-lg font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/75">{p.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
