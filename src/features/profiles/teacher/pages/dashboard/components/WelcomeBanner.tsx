interface WelcomeBannerProps {
  name: string;
  classesToday: number;
  pendingGrades: number;
}

// Helper function to get the greeting based on the hour
function getGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return "Good morning";
  } else if (hour < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

export function WelcomeBanner({ name }: WelcomeBannerProps) {
  const greeting = getGreeting();

  return (
    <div
      className="relative flex min-h-44 flex-col justify-center overflow-hidden rounded-[12px] p-5 text-white sm:min-h-52 sm:p-6 xl:p-8"
      style={{
        background: "linear-gradient(135deg, #550000 0%, #BB0000 100%)",
        boxShadow: "0 12px 32px rgba(85,0,0,0.25)",
      }}
    >
      <div className="relative">
        <span className="qed-type-badge mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 uppercase tracking-widest text-white/80 sm:mb-4">
          Welcome back
        </span>
        <h1 className="qed-type-dashboard-hero break-words">
          {greeting}, {name}!
        </h1>
        <p className="qed-type-hero-description mt-2 max-w-xl text-white/80 sm:mt-3">
          Ready for another day of excellence?
        </p>
      </div>
    </div>
  );
}
