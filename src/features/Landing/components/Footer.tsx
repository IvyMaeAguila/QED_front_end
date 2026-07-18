import { LogoComponent } from "../../../shared/components/Logo";

export const Footer = () => {
    return (
    <>
    {/* Footer */}
      <footer className="bg-[#24143e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <LogoComponent size="sm" />
              <p className="text-3xl font-semibold">QED</p>
            </div>
            <p className="text-white/70 text-sm font-light">
              QUALITY EDUCATION
            </p>
            <p className="text-white/70 text-sm font-light leading-relaxed">
              Empowering educators with modern tools for student success.
            </p>
          </div>

          {/* Features Links */}
          <div>
            <p className="text-lg font-semibold mb-4">Features</p>
            <ul className="flex flex-col gap-2">
              {[
                "Grade Assessment",
                "Topic-based reasoning",
                "Holistic Evaluation",
                "Performance development graph",
                "Synchronize records",
                "Parent Access",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-white/70 text-xs hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <p className="text-lg font-semibold mb-4">Developers</p>
            <ul className="flex flex-col gap-2">
              {["Ivy Mae Aguila", "Kim Louren Luna"].map((name) => (
                <li key={name} className="text-white/70 text-xs">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 py-4 text-center">
          <p className="text-[#5d5d5d] text-sm">
            © 2026 QED. All rights reserved.
          </p>
        </div>
      </footer>
      </>
    );
};
