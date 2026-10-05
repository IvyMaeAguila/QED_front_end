import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, HelpCircle, LogOut, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
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
    isCollapsed: boolean;
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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`absolute lg:relative inset-y-0 left-0 z-30 ${collapsed ? "w-60 lg:w-[4.5rem]" : "w-60"} max-w-[85vw] h-full flex flex-col text-white rounded-tr-none rounded-br-[28px] lg:rounded-none shadow-[8px_0_30px_-12px_rgba(0,0,0,0.35)] transition-[width,transform] duration-300 ${APPLE_EASE} ${
        darkMode ? "bg-[#1A1110]" : "bg-[#4A0000]"
      } ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      {/* Thick Metallic Gold Right Border Accent with rounded-br-[28px] */}
      <div className="absolute top-0 bottom-0 right-0 w-0.75 pointer-events-none rounded-br-[28px] overflow-hidden z-20">
        <div className="absolute inset-0 bg-linear-to-b from-[#F6E073] via-[#F9E37A] to-[#B78C1A] shadow-[0_0_10px_rgba(249,227,122,0.4)] opacity-95" />
      </div>

      <div className={`relative p-6 flex items-center gap-3 ${collapsed ? "lg:justify-center lg:gap-1 lg:px-2 lg:pb-2 lg:pt-4" : ""}`}>
        <div
          className={`w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 ${APPLE_EASE} hover:scale-105 ${collapsed ? "lg:w-8 lg:h-8 lg:rounded-xl" : ""}`}
        >
          <LogoComponent size={collapsed ? "xs" : "sm"} />
        </div>

        <div className={`flex flex-col min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
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

      <div className={`px-5 pt-2.5 pb-2 border-t border-white/10 text-[10px] font-bold opacity-30 uppercase tracking-widest ${collapsed ? "lg:hidden" : ""}`}>
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
                {item.render({ isActive, onCloseSidebar: onClose, darkMode, isCollapsed: collapsed })}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.to!}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              className={`sidebar-nav-item group flex items-center justify-between ${collapsed ? "lg:justify-center lg:px-0" : "px-3.5"} py-2.5 rounded-2xl text-[13px] transition-all duration-300 ${APPLE_EASE} active:scale-[0.97] ${
                isActive
                  ? "bg-white/10 text-white shadow-[0_8px_20px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.25)] backdrop-blur-xl translate-x-1 border border-white/15"
                  : "text-white/55 hover:bg-white/5 hover:text-white hover:translate-x-1 border border-transparent"
      }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.Icon
                  size={16}
                  className={`shrink-0 transition-transform duration-300 ${APPLE_EASE} group-hover:scale-110`}
                />
                <span className={`truncate font-medium ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={`hidden pb-2 lg:flex ${collapsed ? "justify-center px-3" : "justify-end px-5"}`}>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      <div className={`p-5 border-t border-white/10 space-y-1 ${collapsed ? "lg:px-3" : ""}`}>
        <Link
          to={helpItem.to!}
          onClick={onClose}
          title={collapsed ? helpItem.label : undefined}
          aria-label={collapsed ? helpItem.label : undefined}
          className={`sidebar-nav-item flex w-full items-center ${collapsed ? "lg:justify-center lg:px-0" : "gap-3 px-3"} text-left text-[13px] text-white/55 hover:text-white hover:bg-white/10 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 ${APPLE_EASE} hover:translate-x-1 active:scale-[0.97]`}
        >
          <HelpCircle size={16} className="shrink-0" /> <span className={collapsed ? "lg:hidden" : ""}>{helpItem.label}</span>
        </Link>

        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Log Out" : undefined}
          aria-label={collapsed ? "Log Out" : undefined}
          className={`sidebar-nav-item flex w-full items-center ${collapsed ? "lg:justify-center lg:px-0" : "gap-3 px-3"} text-[13px] text-white/55 hover:text-white hover:bg-white/10 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 ${APPLE_EASE} hover:translate-x-1 active:scale-[0.97]`}
        >
          <LogOut size={16} className="shrink-0" /> <span className={collapsed ? "lg:hidden" : ""}>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
