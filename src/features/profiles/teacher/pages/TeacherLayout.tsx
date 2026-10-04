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
    panelBg: darkMode ? "bg-[#111827]/85 backdrop-blur-md" : "bg-white/85 backdrop-blur-md",
    panelBorder: darkMode ? "border-[#1F2937]" : "border-[#E5E7EB]",
    textPrimary: darkMode ? "text-white" : "text-[#111827]",
    textMuted: darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]",
  };

  return (
    <div
      className={`flex h-screen w-full overflow-hidden transition-colors ${darkMode ? "bg-[#1A1110]" : "bg-[#F3F4F6]"}`}
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

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Low-Poly Geometric Faceted Crystal Backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className={`absolute inset-0 ${darkMode ? "bg-[#1A1110]" : "bg-[#F3F4F6]"}`} />

          {/* SVG Low-Poly Triangulated Mesh Pattern - Moderated opacity (0.6) */}
          <div className="absolute inset-0 opacity-55">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1200 800">
              <defs>
                <linearGradient id="poly-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={darkMode ? "#271916" : "#FFFFFF"} />
                  <stop offset="100%" stopColor={darkMode ? "#1D1210" : "#E5E7EB"} />
                </linearGradient>
              </defs>
              {/* Balanced strokeWidth (1.0) and group opacity */}
              <g fill={darkMode ? "#271916" : "#FFFFFF"} stroke={darkMode ? "#452C27" : "#D1D5DB"} strokeWidth="1.0" opacity="0.86">
                {/* Faceted Polygon Network */}
                <polygon points="0,0 200,0 100,150" fill={darkMode ? "#201311" : "#FFFFFF"} />
                <polygon points="200,0 400,0 250,120 100,150" fill={darkMode ? "#241613" : "#F9FAFB"} />
                <polygon points="400,0 600,0 500,160 250,120" fill={darkMode ? "#271916" : "#F3F4F6"} />
                <polygon points="600,0 800,0 700,130 500,160" fill={darkMode ? "#201311" : "#FFFFFF"} />
                <polygon points="800,0 1000,0 900,170 700,130" fill={darkMode ? "#241613" : "#F9FAFB"} />
                <polygon points="1000,0 1200,0 1200,150 900,170" fill={darkMode ? "#271916" : "#F3F4F6"} />

                <polygon points="0,0 100,150 0,300" fill={darkMode ? "#271916" : "#F3F4F6"} />
                <polygon points="100,150 250,120 300,280 0,300" fill={darkMode ? "#1D1210" : "#E5E7EB"} />
                <polygon points="250,120 500,160 400,320 300,280" fill={darkMode ? "#201311" : "#FFFFFF"} />
                <polygon points="500,160 700,130 650,290 400,320" fill={darkMode ? "#241613" : "#F9FAFB"} />
                <polygon points="700,130 900,170 850,310 650,290" fill={darkMode ? "#271916" : "#F3F4F6"} />
                <polygon points="900,170 1200,150 1200,350 850,310" fill={darkMode ? "#1D1210" : "#E5E7EB"} />

                <polygon points="0,300 300,280 150,500 0,550" fill={darkMode ? "#201311" : "#FFFFFF"} />
                <polygon points="300,280 400,320 450,480 150,500" fill={darkMode ? "#241613" : "#F9FAFB"} />
                <polygon points="400,320 650,290 600,520 450,480" fill={darkMode ? "#271916" : "#F3F4F6"} />
                <polygon points="650,290 850,310 800,490 600,520" fill={darkMode ? "#201311" : "#FFFFFF"} />
                <polygon points="850,310 1200,350 1200,550 800,490" fill={darkMode ? "#241613" : "#F9FAFB"} />

                <polygon points="0,550 150,500 300,680 0,800" fill={darkMode ? "#1D1210" : "#E5E7EB"} />
                <polygon points="150,500 450,480 500,700 300,680" fill={darkMode ? "#201311" : "#FFFFFF"} />
                <polygon points="450,480 600,520 700,660 500,700" fill={darkMode ? "#241613" : "#F9FAFB"} />
                <polygon points="600,520 800,490 900,680 700,660" fill={darkMode ? "#271916" : "#F3F4F6"} />
                <polygon points="800,490 1200,550 1200,800 900,680" fill={darkMode ? "#1D1210" : "#E5E7EB"} />
              </g>
            </svg>
          </div>

          {/* Moderate ambient gradient overlay */}
          <div className={`absolute inset-0 ${darkMode ? "bg-linear-to-tr from-[#1A1110]/55 via-transparent to-[#1A1110]/55" : "bg-linear-to-tr from-[#F3F4F6]/45 via-transparent to-[#F3F4F6]/45"}`} />
        </div>

        <Header onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} showNotifications/>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
          <Outlet context={theme} />
        </main>
      </div>
    </div>
  );
}
