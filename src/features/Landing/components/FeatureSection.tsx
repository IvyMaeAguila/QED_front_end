import {
  BookOpenIcon,
  EditIcon,
  DataChartsIcon,
  KnowledgeIcon,
  AlertIcon,
  StudentMonIcon,
} from "./LandingIcons";
import { FeatureCard } from "./Cards";

export const FeatureSection = () => {
  return (
    <section
      id="features"
      className="bg-[#f6f6f6] border-y border-[#dfdfdf] py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-4xl lg:text-5xl font-semibold text-black">
            Everything you need are all in one place
          </p>
          <p className="text-[#5d5d5d] text-base mt-4 max-w-2xl mx-auto leading-relaxed">
            Built with educators in mind, QED provides all the tools necessary
            for efficient student management
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <FeatureCard
            icon={<BookOpenIcon />}
            iconBg="bg-[#006fff]"
            title="Subject Management"
            description="Organize and manage multiple subjects with ease"
          />
          <FeatureCard
            icon={<EditIcon />}
            iconBg="bg-[#9000ff]"
            title="Smart Grading"
            description="Automated grade calculation with real-time sync"
          />
          <FeatureCard
            icon={<DataChartsIcon />}
            iconBg="bg-[#1aff00]"
            title="Performance Analytics"
            description="Track and visualize student performance trends"
          />
          <FeatureCard
            icon={<StudentMonIcon />}
            iconBg="bg-[#EF7C00]"
            title="Student Monitoring"
            description="Comprehensive academic and holistic tracking"
          />
          <FeatureCard
            icon={<KnowledgeIcon />}
            iconBg="bg-[#ffe11e]"
            title="Learning Style Assessment"
            description="Identify and adapt to each student's learning style"
          />
          <FeatureCard
            icon={<AlertIcon />}
            iconBg="bg-[#d90004]"
            title="Intervention"
            description="Early intervention alerts for at-risk students"
          />
        </div>
      </div>
    </section>
  );
};
