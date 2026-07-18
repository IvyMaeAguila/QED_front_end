import Logo from "../images/QED_Logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export const LogoComponent = ({ size = "md" }: LogoProps) => {
  // These sizes map to standard Tailwind heights while keeping the image large
  const sizeClasses = {
    sm: "h-10 w-10", // 40px - perfect for header matching small text stacks
    md: "h-14 w-14", // 56px
    lg: "h-20 w-20"  // 80px
  };

  return (
    <div className={`flex items-center justify-center bg-[#e2e2e2] rounded-2xl shadow-xs shrink-0 ${sizeClasses[size]}`}>
      <img 
        src={Logo} 
        alt="QED Logo" 
        // Using w-4/5 h-4/5 gives it a safe 10% breathing room on all sides 
        // without squeezing the icon itself down into oblivion
        className="w-4/5 h-4/5 object-contain" 
      />
    </div>
  );
};
