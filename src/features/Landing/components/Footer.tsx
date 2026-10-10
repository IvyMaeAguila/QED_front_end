import { LogoComponent } from "../../../shared/components/Logo";

export const Footer = () => {
  return (
    <footer className="bg-maroon text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
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
          <ul className="flex flex-col gap-2">
            {[
              "Student Information Management",
              "Academic Management",
              "Attendance Tracking",
              "Topic-Based Intervention",
              "Parent Access",
              "Reports & Analytics",
            ].map((item) => (
              <li key={item}>
                <a href="#features" className="text-white/75 text-xs transition-colors hover:text-white">
                  {item}
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
