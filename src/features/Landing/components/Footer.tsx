import { LogoComponent } from "../../../shared/components/Logo";

export const Footer = () => {
  return (
    <footer className="bg-maroon text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-[0.85fr_1.5fr_0.65fr] gap-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <LogoComponent size="sm" />
            <p className="text-3xl font-bold font-sans">QED</p>
          </div>
          <p className="text-white/70 text-sm">QUALITY EDUCATION</p>
          <p className="text-white/75 text-sm leading-relaxed">
            Empowering MSEUF-Candelaria's elementary educators with modern
            tools for student success.
          </p>
        </div>

        <div>
          <p className="text-lg font-semibold mb-4">Features</p>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {[
              { label: "Student Information Management", href: "#features" },
              { label: "User & Role Management", href: "#features" },
              { label: "Class & Section Management", href: "#features" },
              { label: "Subject & Curriculum Management", href: "#features" },
              { label: "Academic Year & Term Management", href: "#features" },
              { label: "Class Scheduling", href: "#features" },
              { label: "Grade Recording & Gradebooks", href: "#features" },
              { label: "Assessment Management", href: "#features" },
              { label: "Attendance Tracking", href: "#features" },
              { label: "Holistic Development Monitoring", href: "#features" },
              { label: "Topic-Based Intervention", href: "#intervention" },
              { label: "Study Quest & Learning Videos", href: "#intervention" },
              { label: "Interactive Ed Quizzes", href: "#intervention" },
              { label: "Matching & Memory Games", href: "#intervention" },
              { label: "Parent Access & Student Linking", href: "#features" },
              { label: "Progress Reports & Analytics", href: "#features" },
              { label: "School Calendar & Events", href: "#features" },
              { label: "Notifications & Updates", href: "#features" },
              { label: "Account & Profile Settings", href: "#features" },
            ].map(({ label, href }) => (
              <li key={label}>
                <a href={href} className="text-white/75 text-xs leading-relaxed transition-colors hover:text-white">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-lg font-semibold mb-4">Developers</p>
          <ul className="flex flex-col gap-2">
            {["Ivy Mae Aguila", "Kim Louren Luna"].map((name) => (
              <li key={name} className="text-white/75 text-xs">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15 py-4 text-center">
        <p className="text-white/60 text-sm">© 2026 QED · MSEUF-Candelaria. All rights reserved.</p>
      </div>
    </footer>
  );
};
