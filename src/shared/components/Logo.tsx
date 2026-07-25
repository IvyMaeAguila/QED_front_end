import Logo from "../images/QED_Logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export const LogoComponent = ({ size = "md" }: LogoProps) => {
 
  const sizeClasses = {
    sm: "h-10 w-10", 
    md: "h-14 w-14", 
    lg: "h-20 w-20" 
  };

  return (
    <div className={`flex items-center justify-center bg-[#e2e2e2] rounded-2xl shadow-xs shrink-0 ${sizeClasses[size]}`}>
      <img 
        src={Logo} 
        alt="QED Logo" 
        className="w-4/5 h-4/5 object-contain" 
      />
    </div>
  );
};
