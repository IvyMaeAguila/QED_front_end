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
import { CompactFeatureCard } from "./Cards";
import { Reveal } from "./Reveal";

const FEATURES = [
  {
    icon: <UsersIcon />,
    iconBg: "bg-[#006fff]",
    title: "Student Information Management",
    description: "Organize and maintain student profiles and records.",
  },
  {
    icon: <BookOpenIcon />,
    iconBg: "bg-[#9000ff]",
    title: "Academic Management",
    description: "Manage subjects, grades, assessments, and learning progress.",
  },
  {
    icon: <UserRoundCheckIcon />,
    iconBg: "bg-[#1aac00]",
    title: "Attendance Tracking",
    description: "Record and monitor student attendance efficiently.",
  },
  {
    icon: <AlertIcon />,
    iconBg: "bg-[#d90004]",
    title: "Topic-Based Intervention",
    description: "Identify specific learning topics where students need additional support.",
  },
  {
    icon: <CheckedIcon color="white" />,
    iconBg: "bg-[#EF7C00]",
    title: "Parent Access",
    description: "Allow parents to monitor relevant academic and attendance information.",
  },
  {
    icon: <EditIcon />,
    iconBg: "bg-[#0d66db]",
    title: "Teacher Tools",
    description: "Give teachers tools for assessment, attendance, and student monitoring.",
  },
  {
    icon: <DataChartsIcon />,
    iconBg: "bg-[#C89B3C]",
    title: "Reports & Analytics",
    description: "Present summarized student performance and school data.",
  },
  {
    icon: <StudentMonIcon />,
    iconBg: "bg-[#550000]",
    title: "Role-Based Access",
    description: "Give every user access appropriate to their responsibilities.",
  },
];

export const FeatureSection = () => {
  return (
    <section id="features" className="bg-[#f6f6f6] border-y border-[#dfdfdf] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-4xl lg:text-5xl font-extrabold text-black font-['Sora',sans-serif]">
            Everything Your School Needs
          </p>
          <p className="text-[#5d5d5d] text-base mt-4 max-w-2xl mx-auto leading-relaxed">
            Built for educators, administrators, parents, and students —
            every essential tool, organized in one place.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <CompactFeatureCard {...f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};