import QED_logo from "../../../assets/images/QED_Logo.png";

export const Logo = ({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) => {
  const sizes = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  const radii = {
    sm: "rounded-xl",
    md: "rounded-2xl",
    lg: "rounded-3xl",
  };

  return (
    <div
      className={`${sizes[size]} ${radii[size]} bg-[#d9d9d9] shadow-md flex items-center justify-center overflow-hidden shrink-0`}
    >
      <img
        src={QED_logo}
        alt="QED Logo"
        className="w-[90%] h-[90%] object-cover"
      />
    </div>
  );
};