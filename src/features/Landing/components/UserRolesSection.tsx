import { UsersIcon, EditIcon, UserRoundCheckIcon, KnowledgeIcon, CircleArrowRightIcon } from "./LandingIcons";
import { RoleCard } from "./Cards";
import { Reveal } from "./Reveal";

const ROLES = [
  {
    icon: <UsersIcon color="white" />,
    role: "Administrators",
    description: "Manage school information, users, classes, subjects, and system records.",
  },
  {
    icon: <EditIcon color="white" />,
    role: "Teachers",
    description: "Manage attendance, assessments, grades, and topic-based learning interventions.",
  },
  {
    icon: <UserRoundCheckIcon color="white" />,
    role: "Parents",
    description: "Monitor their child's academic progress and relevant school information.",
  },
  {
    icon: <KnowledgeIcon color="white" />,
    role: "Students",
    description: "Access their academic information and learning progress.",
  },
];

export const UserRolesSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#f6f6f6] border-y border-[#dfdfdf]">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-4xl lg:text-5xl font-extrabold text-black font-['Sora',sans-serif]">
            Built for Your School
          </p>
          <p className="text-[#5d5d5d] text-base mt-4 max-w-2xl mx-auto leading-relaxed">
            Every person in your school community gets the view they need.
          </p>
        </Reveal>

        <div className="flex flex-col lg:flex-row items-stretch gap-4">
          {ROLES.map((r, i) => (
            <div key={r.role} className="flex items-center gap-4 flex-1">
              <Reveal delay={i * 120} className="flex-1 h-full">
                <RoleCard {...r} />
              </Reveal>
              {i < ROLES.length - 1 && (
                <CircleArrowRightIcon color="#bb0000" className="hidden lg:block shrink-0 opacity-40" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};