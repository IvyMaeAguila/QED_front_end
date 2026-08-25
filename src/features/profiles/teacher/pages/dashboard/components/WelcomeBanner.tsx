import { GraduationCap } from "lucide-react";

interface WelcomeBannerProps {
  name: string;
  classesToday: number;
  pendingGrades: number;
}

export function WelcomeBanner({ name, classesToday, pendingGrades }: WelcomeBannerProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-8 sm:p-10 text-white h-full flex flex-col justify-center min-h-55"
      style={{
        background: "linear-gradient(135deg, #550000 0%, #BB0000 100%)",
        boxShadow: "0 12px 32px rgba(85,0,0,0.25)",
      }}
    >
      <GraduationCap
        size={280}
        strokeWidth={1}
        className="absolute -right-10 -bottom-14 opacity-[0.07] pointer-events-none rotate-15"
      />

      <div className="relative">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-bold tracking-widest uppercase mb-4 border border-white/10">
          Welcome back
        </span>
        <h1 className="text-2xl sm:text-[32px] font-black leading-tight tracking-tight">
          Good morning, {name}!
        </h1>
        <p className="text-sm sm:text-[15px] text-white/80 mt-3 max-w-xl leading-relaxed">
          Ready for another day of excellence? You have{" "}
          <span className="font-bold text-white underline underline-offset-4 decoration-white/40">
            {classesToday} {classesToday === 1 ? "class" : "classes"}
          </span>{" "}
          scheduled
          {pendingGrades > 0 && (
            <>
              {" "}and <span className="font-bold text-white">{pendingGrades} pending {pendingGrades === 1 ? "grade" : "grades"}</span> to finalize
            </>
          )}
          .
        </p>
      </div>
    </div>
  );
}