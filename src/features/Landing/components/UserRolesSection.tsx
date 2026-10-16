import { ArrowRight, UsersRound } from "lucide-react";
import { UsersIcon, EditIcon, UserRoundCheckIcon, KnowledgeIcon } from "./LandingIcons";
import { Reveal } from "./Reveal";

const ROLES = [
  {
    icon: <UsersIcon color="var(--color-maroon)" />,
    role: "Administrators",
    description: "Manage student records, classes, subjects, and school accounts.",
  },
  {
    icon: <EditIcon color="var(--color-maroon)" />,
    role: "Teachers",
    description: "Record attendance and grades, then follow learning progress by topic.",
  },
  {
    icon: <UserRoundCheckIcon color="var(--color-maroon)" />,
    role: "Parents",
    description: "Stay informed about a child’s academic progress and school activity.",
  },
  {
    icon: <KnowledgeIcon color="var(--color-maroon)" />,
    role: "Students",
    description: "Review academic information and keep track of learning progress.",
  },
];

export const UserRolesSection = () => (
  <section className="bg-[#F5F4F1] px-4 py-14 sm:px-8 sm:py-16 lg:px-12">
    <div className="mx-auto max-w-[1200px]">
      <Reveal className="mb-8 flex flex-col gap-3 border-b border-[#DED9D3] pb-6 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-ink">Your school community</p>
          <h2 className="mt-2 font-sans text-3xl font-bold leading-tight text-[#211819] sm:text-4xl">Built for the people behind every student.</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#62595A]">Each person has a clear place in the work of supporting learning.</p>
      </Reveal>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role, index) => (
          <Reveal key={role.role} delay={index * 50} className="h-full">
            <article className="landing-polygon-surface flex h-full min-h-[190px] flex-col rounded-3xl border border-[#E0E4E9] bg-white p-5 shadow-[0_8px_24px_rgba(31,41,55,0.06)] sm:p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F0EEEB] [&_svg]:h-5 [&_svg]:w-5">{role.icon}</span>
                <span className="text-xs font-semibold tabular-nums text-[#8A8180]">0{index + 1}</span>
              </div>
              <h3 className="mt-7 font-sans text-xl font-semibold text-[#241B1C]">{role.role}</h3>
              <p className="mt-2 text-sm leading-6 text-[#62595A]">{role.description}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={100} className="mt-5">
        <div className="flex flex-col gap-5 rounded-3xl bg-maroon px-5 py-6 text-white shadow-[0_8px_24px_rgba(31,41,55,0.08)] sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-white"><UsersRound size={20} /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">Family connection</p>
              <h3 className="mt-1 font-sans text-xl font-semibold sm:text-2xl">Parents can follow progress and stay involved.</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Relevant academic, holistic, and classroom information is available through the parent view.</p>
            </div>
          </div>
          <a href="#intervention" className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-white px-4 py-3 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-soft sm:self-center">Explore learning support <ArrowRight size={15} /></a>
        </div>
      </Reveal>
    </div>
  </section>
);
