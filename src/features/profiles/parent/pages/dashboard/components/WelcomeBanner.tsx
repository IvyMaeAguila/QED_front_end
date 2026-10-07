import { Bell, CircleUserRound, ListChecks, UserPlus } from "lucide-react";

interface WelcomeBannerProps {
  parentName: string;
  childrenCount: number;
  noticesCount: number;
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

// Helper function to get the greeting based on the hour
function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function WelcomeBanner({
  parentName,
  childrenCount,
  noticesCount,
  onLinkStudent,
  panelBorder = "border-[#E5E7EB]",
  textPrimary = "text-gray-900",
  textMuted = "text-gray-500",
  darkMode = false,
}: WelcomeBannerProps) {
  const greeting = getGreeting();
  const hasChildren = childrenCount > 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white"
      style={{
        background: "linear-gradient(135deg, #550000 0%, #BB0000 100%)",
        boxShadow: "0 12px 32px rgba(85,0,0,0.25)",
      }}
    >
      <div className="relative flex min-h-48 flex-col justify-center p-6 sm:p-8">
        <span className="qed-type-badge mb-4 inline-flex w-fit items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 uppercase tracking-widest text-white/80">
          Welcome back
        </span>
        <h1 className="qed-type-dashboard-hero">
          {greeting}, {parentName}!
        </h1>
        <p className="qed-type-hero-description mt-2 max-w-xl text-white/80">
          Track your children's academic progress and stay connected with MSEUF-CI.
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
            <CircleUserRound size={14} />
            {childrenCount} {childrenCount === 1 ? "Child" : "Children"} Enrolled
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              darkMode ? "bg-[#111827] text-white" : "bg-white text-[#550000]"
            }`}
          >
            <Bell size={14} />
            {noticesCount > 0 ? `${noticesCount} New Notices` : "No Notices"}
          </span>
        </div>
      </div>

      {!hasChildren && (
        <div className={`border-t border-white/10 px-6 py-6 sm:px-8 ${darkMode ? "bg-[#2A1A18]" : "bg-white"}`}>
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className={`hidden h-24 w-32 shrink-0 items-center justify-center rounded-lg sm:flex ${darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}`}>
              <CircleUserRound size={44} className="text-[#6B0000]/60" />
            </div>
            <div className="flex-1">
              <h2 className={`text-base font-bold ${textPrimary}`}>
                Welcome, {parentName.split(" ")[0]}
              </h2>
              <p className={`mt-1 text-sm ${textMuted}`}>
                Start by linking your child to view their academic progress, daily updates, and school calendar in one place.
              </p>
              <button
                onClick={onLinkStudent}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#550000] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#BB0000]"
              >
                <UserPlus size={16} />
                Link Student
              </button>
            </div>
          </div>

          <div className={`mt-6 border-t pt-5 ${panelBorder}`}>
            <p className={`mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${textMuted}`}>
              <ListChecks size={14} />
              Quick Guide
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {guideSteps.map((step) => (
                <div key={step.number} className={`flex items-start gap-2.5 rounded-lg border p-3 ${panelBorder}`}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#550000] text-xs font-bold text-white">
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
    </div>
  );
}
