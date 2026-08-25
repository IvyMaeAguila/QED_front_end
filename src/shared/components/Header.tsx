import { Menu } from "lucide-react";
import { useSettings } from "../../features/profiles/admin/pages/settings/context/SettingsContext";
// import { ProfileMenu } from "../../features/profiles/admin/pages/settings/components/ProfileMenu";
import { SettingsMenu } from "../../features/profiles/admin/pages/settings/components/SettingsMenu";
import { ProfileMenu } from "../../shared/profile/components/ProfileMenu";

interface HeaderProps {
  onMenuClick: () => void;
  onLogout?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { darkMode, schoolAcronym, schoolName } = useSettings();
  const mutedText = darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]";

  return (
    <header
      className={`h-16 border-b flex items-center justify-between gap-2 px-3 sm:px-6 shrink-0 z-20 transition-colors ${
        darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-[#E5E7EB]"
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 pl-12 lg:pl-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg bg-[#6B0000] text-white shrink-0 absolute left-3 top-3.5 z-30"
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
            {schoolAcronym}
          </h2>
          <p className={`hidden sm:block text-xs font-semibold mt-1 truncate ${mutedText}`}>
            {schoolName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <ProfileMenu />
        <SettingsMenu />
      </div>
    </header>
  );
}