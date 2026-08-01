import { Link, useLocation } from "react-router-dom";
import { HelpCircle, LogOut, X, type LucideIcon } from "lucide-react";
import { LogoComponent } from "./Logo";

export interface NavItem {
  label: string;
  Icon: LucideIcon;
  to: string;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  darkMode: boolean;
  navItems: NavItem[];
  helpItem: NavItem;
  homeTo: string;
}

export function Sidebar({
  open,
  onClose,
  onLogout,
  darkMode,
  navItems,
  helpItem,
  homeTo,
}: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={`w-60 max-w-[85vw] h-full flex flex-col text-white transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
        darkMode ? "bg-[#0F172A]" : "bg-[#4A0000]"
      } ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ease-out hover:scale-105">
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
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/10 hover:bg-white/20 transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) active:scale-95"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 pt-2.5 pb-2 border-t border-white/10 text-[10px] font-bold opacity-30 uppercase tracking-widest">
        Main Menu
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.to === homeTo
              ? location.pathname === homeTo
              : location.pathname.startsWith(item.to);

          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) active:scale-[0.98] ${
                isActive
                  ? "bg-white/10 text-white shadow-xl shadow-black/15 translate-x-1"
                  : "text-white/55 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-black/5 hover:translate-x-1"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.Icon size={16} className="shrink-0 transition-transform duration-300 ease-out" />
                <span className="truncate">{item.label}</span>
              </div>

              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#C98A2B] shrink-0 transition-all duration-300 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-white/10">
        <Link
          to={helpItem.to}
          onClick={onClose}
          className="flex items-center gap-3 text-[13px] text-white/55 hover:text-white hover:bg-white/10 px-3 py-2.5 rounded-xl cursor-pointer mb-2 transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) hover:shadow-lg hover:shadow-black/5 hover:translate-x-1 active:scale-[0.98]"
        >
          <HelpCircle size={16} className="shrink-0" /> {helpItem.label}
        </Link>

        <div
          onClick={onLogout}
          className="flex items-center gap-3 text-[13px] text-white/55 hover:text-white hover:bg-white/10 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) hover:shadow-lg hover:shadow-black/5 hover:translate-x-1 active:scale-[0.98]"
        >
          <LogOut size={16} className="shrink-0" /> Log Out
        </div>
      </div>
    </aside>
  );
}