import { UsersIcon } from './LandingIcons'

export const ParentAcessSection = () => (
    <section className="py-16 px-4 bg-[#fafafa]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
        <div className="shrink-0">
          <div className="w-20 h-20 bg-maroon rounded-xl shadow-lg flex items-center justify-center">
              <UsersIcon color="white"/>
          </div>
        </div>
        <div>
          <p className="text-2xl md:text-3xl font-semibold text-brand-ink leading-snug">
            Parent access viewing for better child support
          </p>
          <p className="text-[#5d5d5d] text-base mt-3 leading-relaxed">
            Empower parents with real-time access to their child's academic performance, holistic development, and classroom
            activity—all in one intuitive dashboard designed to keep them informed, involved, and connected.
          </p>
        </div>
      </div>
    </section>
);
