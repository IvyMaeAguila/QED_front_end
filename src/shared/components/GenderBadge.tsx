interface GenderBadgeProps {
  gender: "Male" | "Female";
  darkMode: boolean;
}

// Male: text #1D70D6, bg #EAF2FF (light) / accent25 (dark)
// Female: text #C2255C, bg #FCE7F1 (light) / accent25 (dark)
export function GenderBadge({ gender, darkMode }: GenderBadgeProps) {
  const isMale = gender === "Male";

  const classes = isMale
    ? darkMode
      ? "bg-[#8B0D0D25] text-[#5B9BE0]"
      : "bg-[#EAF2FF] text-[#1D70D6]"
    : darkMode
      ? "bg-[#8B0D0D25] text-[#E5799F]"
      : "bg-[#FCE7F1] text-[#C2255C]";

  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${classes}`}
    >
      {isMale ? "M" : "F"}
    </span>
  );
}