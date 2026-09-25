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
      className="relative overflow-hidden rounded-2xl p-8 sm:p-10 text-white h-full flex flex-col justify-center min-h-55"
      style={{
        background: "linear-gradient(135deg, #550000 0%, #BB0000 100%)",
        boxShadow: "0 12px 32px rgba(85,0,0,0.25)",
      }}
    >
      <div className="relative">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-bold tracking-widest uppercase mb-4 border border-white/10">
          Welcome back
        </span>
        <h1 className="text-2xl sm:text-[32px] font-black leading-tight tracking-tight">
          {greeting}, {name}!
        </h1>
        <p className="text-sm sm:text-[15px] text-white/80 mt-3 max-w-xl leading-relaxed">
          Ready for another day of excellence?
        </p>
      </div>
    </div>
  );
}