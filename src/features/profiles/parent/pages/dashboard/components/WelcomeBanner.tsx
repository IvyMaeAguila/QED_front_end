import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { DashboardWelcomeBanner } from "@shared/components/DashboardWelcomeBanner";
import { CircleUserRound, ListChecks, UserPlus } from "lucide-react";

interface WelcomeBannerProps {
  parentName: string;
  childrenCount: number;
  loadingStudents?: boolean;
  onLinkStudent: () => void;
  panelBorder?: string;
  textPrimary?: string;
  textMuted?: string;
  darkMode?: boolean;
}

const guideSteps = [
  { number: 1, title: "Link your child", description: "Input your child's student number and name." },
  { number: 2, title: "Verify details", description: "Once submitted, confirm the student's information." },
  { number: 3, title: "Track progress", description: "View attendance and progress anytime." },
];

export function ParentLinkingGuide({
  parentName,
  childrenCount,
  loadingStudents = false,
  onLinkStudent,
  panelBorder = "border-border-subtle",
  textPrimary = "text-gray-900",
  textMuted = "text-gray-500",
  darkMode = false,
}: WelcomeBannerProps) {
  const hasChildren = childrenCount > 0;

  const renderGuide = (pending: boolean) => <>      {(pending || !hasChildren) && (
        <div className={`border-t border-white/10 px-6 py-6 sm:px-8 ${darkMode ? "bg-panel-dark" : "bg-white"}`}>
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className={`hidden h-24 w-32 shrink-0 items-center justify-center rounded-lg sm:flex ${darkMode ? "bg-white/5" : "bg-brand-light"}`}>
              <CircleUserRound size={44} className="text-brand-ink/60" />
            </div>
            <div className="flex-1">
              <h2 className={`text-base font-bold ${textPrimary}`}>
                Welcome, {parentName.split(" ")[0]}
              </h2>
              <p className={`mt-1 text-sm ${textMuted}`} data-sk-region="welcomebanner-start-by-linking-your-child-to-view-their-aca" data-sk-static="">
                Start by linking your child to view their academic progress, daily updates, and school calendar in one place.
              </p>
              <button
                onClick={onLinkStudent}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-maroon px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-maroon-light" data-sk-region="welcomebanner-link-student" data-sk-static=""
              >
                <UserPlus size={16} />
                Link Student
              </button>
            </div>
          </div>

          <div className={`mt-6 border-t pt-5 ${panelBorder}`}>
            <p className={`mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${textMuted}`} data-sk-region="welcomebanner-quick-guide" data-sk-static="">
              <ListChecks size={14} />
              Quick Guide
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {guideSteps.map((step) => (
                <div key={step.number} className={`flex items-start gap-2.5 rounded-lg border p-3 ${panelBorder}`}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-maroon text-xs font-bold text-white">
                    {step.number}
                  </span>
                  <div>
                    <p className={`text-xs font-semibold ${textPrimary}`}>{step.title}</p>
                    <p className={`text-xs leading-snug ${textMuted}`}>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
</>;
  return <LoadingRegion name="parent-linking-guide" loading={loadingStudents} variable skeleton={null} frame={renderGuide}>{null}</LoadingRegion>;
}
export default function WelcomeBanner({ parentName }: { parentName: string }) {
  return <DashboardWelcomeBanner name={parentName} description="Track your children's academic progress and stay connected with MSEUF-CI." />;
}
