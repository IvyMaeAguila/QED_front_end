import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@shared/components/Sidebar";
import { Header } from "@shared/components/Header";
import { useSettings } from "../../admin/pages/settings/context/SettingsContext";
import { TEACHER_NAV_ITEMS, TEACHER_HELP_ITEM } from "./config/teacherNav";
import type { AdminThemeContext } from "../../admin/pages/AdminLayout";

interface TeacherLayoutProps {
  onLogout: () => void;
}

export function TeacherLayout({ onLogout }: TeacherLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode } = useSettings();

  const theme: AdminThemeContext = {
    darkMode,
    panelBg: darkMode ? "bg-[#111827]" : "bg-white",
    panelBorder: darkMode ? "border-[#1F2937]" : "border-[#E5E7EB]",
    textPrimary: darkMode ? "text-white" : "text-[#111827]",
    textMuted: darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]",
  };

  return (
    <div
      className={`flex h-screen w-full overflow-hidden transition-colors ${darkMode ? "bg-[#0B1120]" : "bg-[#F6F7FB]"}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={onLogout}
          darkMode={darkMode}
          navItems={TEACHER_NAV_ITEMS}
          helpItem={TEACHER_HELP_ITEM}
          homeTo="/teacher"
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={theme} />
        </main>
      </div>
    </div>
  );
}