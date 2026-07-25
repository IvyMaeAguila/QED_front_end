import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BookMarked,
  Calendar,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import { LogoComponent } from "../../../../../shared/components/Logo";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  darkMode: boolean;
}

const NAV_ITEMS = [
  { label: "Dashboard", Icon: LayoutDashboard, to: "/admin" },
  { label: "Student Records", Icon: Users, to: "/admin/students" },
  { label: "Manage Users", Icon: Users, to: "/admin/users" },
  { label: "Classes", Icon: BookOpen, to: "/admin/classes" },
  { label: "Academics", Icon: BookMarked, to: "/admin/subjects" },
  { label: "Calendar", Icon: Calendar, to: "/admin/calendar" },
];

const HELP_ITEM = { label: "Help & Support", Icon: HelpCircle, to: "/admin/help" };

export function Sidebar({ open, onClose, onLogout, darkMode }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={`w-60 max-w-[85vw] h-full flex flex-col text-white transition-colors ${
        darkMode ? "bg-[#0F172A]" : "bg-[#4A0000]"
      } ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
          <LogoComponent size="sm" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-bold text-[15px] leading-tight truncate">QED</span>
          <span className="text-[9px] opacity-50 uppercase tracking-widest truncate">
            Quality Education
          </span>
        </div>

        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 pt-2.5 pb-2 border-t border-white/10 text-[10px] font-bold opacity-30 uppercase tracking-widest">
        Main Menu
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.to === "/admin" 
            ? location.pathname === "/admin" 
            : location.pathname.startsWith(item.to);

          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.Icon size={16} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>

              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#C98A2B] shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-white/10">
        <Link
          to={HELP_ITEM.to}
          onClick={onClose}
          className="flex items-center gap-3 text-[13px] text-white/55 hover:text-white cursor-pointer mb-4 transition-colors"
        >
          <HelpCircle size={16} className="shrink-0" /> Help & Support
        </Link>

        <div
          onClick={onLogout}
          className="flex items-center gap-3 text-[13px] text-white/55 hover:text-white cursor-pointer transition-colors"
        >
          <LogOut size={16} className="shrink-0" /> Log Out
        </div>
      </div>
    </aside>
  );
}