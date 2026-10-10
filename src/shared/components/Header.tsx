import { Menu, Moon, Sun } from "lucide-react";
import { useSettings } from "../../features/profiles/admin/pages/settings/context/SettingsContext";
import { ProfileMenu } from "../../shared/profile/components/ProfileMenu";
import { NotificationBell } from "@shared/notification/NotificationBell";
import eucLogo from "../../assets/images/EUC.webp";

interface HeaderProps {
  onMenuClick: () => void;
  onLogout?: () => void;
  showNotifications?: boolean;
}

export function Header({
  onMenuClick,
  showNotifications = false,
}: HeaderProps) {
  const { darkMode, toggleDarkMode } = useSettings();
  const institutionText = darkMode ? "text-brand-light" : "text-brand-ink";

  return (
    <header
      className={`shrink-0 z-20 border-b font-sans transition-colors ${
        darkMode ? "bg-raised-dark border-border-dark" : "bg-white border-border-subtle"
      }`}
    >
      <div
        className="flex min-h-8 items-center justify-center gap-2 px-3 py-1 text-xs font-semibold tracking-wide text-white/90 sm:px-6 sm:text-xs"
        style={{ backgroundColor: "var(--sidebar-maroon)" }}
      >
        <img src={eucLogo} alt="" aria-hidden="true" className="h-5 w-5 shrink-0 object-contain sm:h-6 sm:w-6" />
        <span className="max-w-full text-center leading-tight">MSEUF-CI</span>
      </div>

      <div className="relative flex min-h-16 items-center justify-between gap-1 px-2 py-2 sm:gap-2 sm:px-6 sm:py-0">
        <button
          onClick={onMenuClick}
          className="absolute left-3 top-3.5 z-30 shrink-0 rounded-lg bg-maroon p-2 text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={17} />
        </button>

        <div className="min-w-0 flex-1 pl-11 sm:pl-12 lg:pl-0">
          <p
            title="Manuel S. Enverga University Foundation - Candelara, Inc."
            className={`qed-type-header break-words leading-tight tracking-tight lg:truncate ${institutionText}`}
          >
            Manuel S. Enverga University Foundation - Candelara, Inc.
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2 lg:gap-4">
          {showNotifications && <NotificationBell />}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={darkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              darkMode
                ? "text-amber-300 hover:bg-white/10"
                : "text-brand-ink hover:bg-surface"
            }`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
