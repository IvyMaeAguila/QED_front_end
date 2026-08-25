import { StudentMonIcon, CircleArrowRightIcon, DataChartsIcon, UsersIcon } from "./LandingIcons";
import { PillarCard } from "./Cards";
import { Reveal } from "./Reveal";

const PILLARS = [
  {
    icon: <StudentMonIcon />,
    title: "Centralized",
    description: "All essential student and academic information is organized in one platform.",
  },
  {
    icon: <CircleArrowRightIcon />,
    title: "Efficient",
    description: "Reduce repetitive manual processes and make school information easier to manage.",
  },
  {
    icon: <DataChartsIcon />,
    title: "Insightful",
    description: "Use academic and assessment data to better understand student learning progress.",
  },
  {
    icon: <UsersIcon />,
    title: "Connected",
    description: "Support communication and information access among teachers, parents, students, and admins.",
  },
];

export const WhyChooseSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-10">
          <p className="text-4xl lg:text-5xl font-extrabold text-black font-['Sora',sans-serif]">
            Why Choose QED?
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/5">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <PillarCard {...p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};