import {
  UsersIcon,
  BookOpenIcon,
  UserRoundCheckIcon,
  AlertIcon,
  CheckedIcon,
  EditIcon,
  DataChartsIcon,
  StudentMonIcon,
} from "./LandingIcons";
import { Reveal } from "./Reveal";
import { ArrowUpRight, Brain, Heart, ListChecks, UsersRound } from "lucide-react";

const FEATURES = [
  {
    icon: <UsersIcon color="#800000" />,
    eyebrow: "Student records",
    title: "Student Information Management",
    description: "Organize and maintain student profiles and records.",
  },
  {
    icon: <BookOpenIcon color="#800000" />,
    eyebrow: "Academic progress",
    title: "Academic Management",
    description: "Manage subjects, grades, assessments, and learning progress.",
  },
  {
    icon: <UserRoundCheckIcon color="#800000" />,
    eyebrow: "Daily attendance",
    title: "Attendance Tracking",
    description: "Record and monitor student attendance efficiently.",
  },
  {
    icon: <AlertIcon color="#800000" />,
    eyebrow: "Learning intervention",
    title: "Topic-Based Intervention",
    description: "Identify specific learning topics where students need additional support.",
  },
  {
    icon: <CheckedIcon color="#800000" />,
    eyebrow: "Family connection",
    title: "Parent Access",
    description: "Allow parents to monitor relevant academic and attendance information.",
  },
  {
    icon: <EditIcon color="#800000" />,
    eyebrow: "Teacher tools",
    title: "Teacher Tools",
    description: "Give teachers tools for assessment, attendance, and student monitoring.",
  },
  {
    icon: <DataChartsIcon color="#800000" />,
    eyebrow: "School insights",
    title: "Reports & Analytics",
    description: "Present summarized student performance and school data.",
  },
  {
    icon: <StudentMonIcon color="#800000" />,
    eyebrow: "Role-based access",
    title: "Role-Based Access",
    description: "Give every user access appropriate to their responsibilities.",
  },
];

export const FeatureSection = () => (
    <section id="features" className="bg-[#F5F4F1] px-4 py-14 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="mb-8 flex flex-col gap-3 border-b border-[#DED9D3] pb-6 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#800000]">The QED platform</p>
            <h2 className="mt-2 max-w-2xl font-sans text-3xl font-bold leading-tight text-[#211819] sm:text-4xl">Everything your school needs, working together.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#62595A]">
            A connected set of tools for the everyday work of supporting students—from the first record to the next learning breakthrough.
          </p>
        </Reveal>

        <Reveal className="mb-5">
          <article className="relative grid overflow-hidden rounded-3xl border border-[#E5D6D3] bg-[#FFF9F7] shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden bg-[#650000] px-6 py-7 text-white sm:px-8 sm:py-9">
              <div aria-hidden="true" className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[24px] border-white/[0.06]" />
              <div className="relative max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#F2D6AE]">
                  <Brain size={14} /> Holistic development
                </span>
                <h3 className="mt-4 font-sans text-2xl font-bold leading-tight sm:text-3xl">
                  See the whole learner, not just the grades.
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/75">
                  QED brings together insights about how students think, feel, act, and connect—helping families and teachers understand strengths and where support can make a difference.
                </p>
                <a href="#intervention" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white">
                  Explore student support <ArrowUpRight size={15} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {[
                { name: "Cognitive", detail: "Thinking and understanding", Icon: Brain, color: "text-[#4779B8]", tint: "bg-[#EDF4FC]" },
                { name: "Emotional", detail: "Motivation and confidence", Icon: Heart, color: "text-[#BB5660]", tint: "bg-[#FCEFF0]" },
                { name: "Behavioral", detail: "Focus and self-management", Icon: ListChecks, color: "text-[#A77622]", tint: "bg-[#FBF5E8]" },
                { name: "Social", detail: "Collaboration and connection", Icon: UsersRound, color: "text-[#468273]", tint: "bg-[#EDF7F3]" },
              ].map(({ name, detail, Icon, color, tint }) => (
                <div key={name} className="flex min-h-[82px] items-center gap-3 rounded-2xl border border-[#ECE4E0] bg-white px-4 py-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint} ${color}`}>
                    <Icon size={19} strokeWidth={2} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#241B1C]">{name}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-[#706566]">{detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </article>
        </Reveal>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 55} className="h-full">
              <article className="landing-polygon-surface flex h-full min-h-[190px] flex-col rounded-2xl border border-[#E1DDD7] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EEEB] [&_svg]:h-5 [&_svg]:w-5">{f.icon}</span>
                  <span className="text-[10px] font-semibold text-[#8A8180]">{f.eyebrow}</span>
                </div>
                <div className="mt-7">
                  <h3 className="max-w-[16rem] font-sans text-xl font-semibold text-[#241B1C]">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#62595A]">{f.description}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
);
