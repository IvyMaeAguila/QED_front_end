import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";

interface EnrolledChildrenNavItemProps {
  isActive: boolean;
  onCloseSidebar: () => void;
}

export default function EnrolledChildrenNavItem({
  isActive,
  onCloseSidebar,
}: EnrolledChildrenNavItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/parent/enrolled-children");
    onCloseSidebar();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-all duration-300 active:scale-[0.98] ${
        isActive
          ? "bg-white/10 text-white shadow-xl shadow-black/15 translate-x-1"
          : "text-white/55 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-black/5 hover:translate-x-1"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <UserPlus size={16} className="shrink-0" />
        <span className="truncate">Enrolled Children</span>
      </div>
      {isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-[#C98A2B] shrink-0 animate-pulse" />
      )}
    </button>
  );
}