import { Search, Settings, User, Menu, Moon, Sun } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Header({ onMenuClick, darkMode, onToggleDarkMode }: HeaderProps) {
  return (
    <header
      className={`h-16 border-b flex items-center justify-between gap-2 px-3 sm:px-6 shrink-0 z-20 transition-colors ${
        darkMode
          ? "bg-[#111827] border-[#374151]"
          : "bg-white border-[#E5E7EB]"
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg bg-[#6B0000] text-white shrink-0"
          aria-label="Open menu"
        >
          <Menu size={17} />
        </button>

        <div className="min-w-0">
          <h2
            className={`text-base sm:text-xl font-bold leading-none truncate ${
              darkMode ? "text-white" : "text-[#6B0000]"
            }`}
          >
            Elementary Dashboard
          </h2>
          <p
            className={`hidden sm:block text-xs font-semibold mt-1 truncate ${
              darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"
            }`}
          >
            Smart decisions through organized insights
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div
          className={`hidden md:flex relative items-center rounded-xl border transition-colors ${
            darkMode
              ? "bg-[#1F2937] border-[#374151]"
              : "bg-[#F7F7F8] border-[#D1D5DB]"
          }`}
        >
          <Search
            size={18}
            className={`absolute left-3 ${
              darkMode ? "text-[#D1D5DB]" : "text-[#5F6368]"
            }`}
          />
          <input
            className={`pl-10 pr-4 py-2 rounded-xl bg-transparent text-sm font-medium w-40 lg:w-55 outline-none ${
              darkMode
                ? "text-white placeholder:text-[#9CA3AF]"
                : "text-[#1F2937] placeholder:text-[#555]"
            }`}
            placeholder="Search"
          />
        </div>

        <button
          onClick={onToggleDarkMode}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            darkMode
              ? "bg-[#374151] text-yellow-300 hover:bg-[#4B5563]"
              : "bg-[#E5E5E5] text-[#6B0000] hover:bg-[#DADADA]"
          }`}
          title="Toggle dark mode"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              darkMode ? "bg-[#374151]" : "bg-[#E5E5E5]"
            }`}
          >
            <User size={17} className="text-[#6B0000]" />
          </div>

          <div className="hidden lg:block leading-tight">
            <p
              className={`text-sm font-bold ${
                darkMode ? "text-white" : "text-black"
              }`}
            >
              Admin
            </p>
            <p
              className={`text-xs ${
                darkMode ? "text-[#D1D5DB]" : "text-[#555]"
              }`}
            >
              System Manager
            </p>
          </div>
        </div>

        <button
          className="hidden sm:flex w-9 h-9 items-center justify-center text-[#6B0000] hover:scale-105 transition-transform shrink-0"
          title="Settings"
        >
          <Settings size={27} />
        </button>
      </div>
    </header>
  );
}