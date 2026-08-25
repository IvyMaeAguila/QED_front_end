import { Link, useLocation } from "react-router-dom";
import { HelpCircle, LogOut, X, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { LogoComponent } from "./Logo";

export interface NavItem {
  label: string;
  Icon: LucideIcon;
  to?: string;
  // For nav items that aren't a plain route link (e.g. hover flyout,
  // mobile redirect). If provided, Sidebar renders this instead of a <Link>.
  render?: (args: {
    isActive: boolean;
    onCloseSidebar: () => void;
    darkMode: boolean;
  }) => ReactNode;
  // Used to compute isActive when `render` is used and there's no `to`.
  activeMatch?: string;
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

// The actual "Apple" deceleration curve (used across iOS/macOS sheet and
// panel transitions) — starts fast, settles gently.
const APPLE_EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

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
      className={`absolute lg:relative inset-y-0 left-0 z-30 w-60 max-w-[85vw] h-full flex flex-col text-white rounded-r-[28px] lg:rounded-none shadow-[8px_0_30px_-12px_rgba(0,0,0,0.35)] transition-transform duration-500 ${APPLE_EASE} ${
        darkMode ? "bg-[#0F172A]" : "bg-[#4A0000]"
      } ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="p-6 flex items-center gap-3">
        <div
          className={`w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 ${APPLE_EASE} hover:scale-105`}
        >
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
          className={`lg:hidden w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/10 hover:bg-white/20 transition-all duration-300 ${APPLE_EASE} active:scale-90`}
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 pt-2.5 pb-2 border-t border-white/10 text-[10px] font-bold opacity-30 uppercase tracking-widest">
        Main Menu
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.to
            ? item.to === homeTo
              ? location.pathname === homeTo
              : location.pathname.startsWith(item.to)
            : item.activeMatch
            ? location.pathname.startsWith(item.activeMatch)
            : false;

          if (item.render) {
            return (
              <div key={item.label}>
                {item.render({ isActive, onCloseSidebar: onClose, darkMode })}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.to!}
              onClick={onClose}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-2xl text-[13px] transition-all duration-300 ${APPLE_EASE} active:scale-[0.97] ${
                isActive
                  ? "bg-white/12 text-white shadow-lg shadow-black/15 translate-x-1"
                  : "text-white/55 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.Icon
                  size={16}
                  className={`shrink-0 transition-transform duration-300 ${APPLE_EASE} group-hover:scale-110`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#C98A2B] shrink-0 animate-[softPulse_2.2s_ease-in-out_infinite]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-white/10 space-y-1">
        <Link
          to={helpItem.to!}
          onClick={onClose}
          className={`flex items-center gap-3 text-[13px] text-white/55 hover:text-white hover:bg-white/10 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 ${APPLE_EASE} hover:translate-x-1 active:scale-[0.97]`}
        >
          <HelpCircle size={16} className="shrink-0" /> {helpItem.label}
        </Link>

        <div
          onClick={onLogout}
          className={`flex items-center gap-3 text-[13px] text-white/55 hover:text-white hover:bg-white/10 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 ${APPLE_EASE} hover:translate-x-1 active:scale-[0.97]`}
        >
          <LogOut size={16} className="shrink-0" /> Log Out
        </div>
      </div>

      <style>{`
        @keyframes softPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.85); }
        }
      `}</style>
    </aside>
  );
}