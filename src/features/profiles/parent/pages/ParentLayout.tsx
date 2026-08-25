import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@shared/components/Sidebar";
import { Header } from "@shared/components/Header";
import { useSettings } from "../../admin/pages/settings/context/SettingsContext";
import { PARENT_NAV_ITEMS, PARENT_HELP_ITEM } from "./config/parentNavItem";
import type { AdminThemeContext } from "../../admin/pages/AdminLayout";
import { useParentDashboard } from "./dashboard/context/ParentDashboardContext";
import LinkStudentModal from "./EnrollledStudent/modal/linkStudentModal";
import VerifyStudentModal from "./EnrollledStudent/modal/verifyStudentModal";

interface ParentLayoutProps {
  onLogout: () => void;
}

export function ParentLayout({ onLogout }: ParentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode } = useSettings();

  // Link-modal open/close ay local na sa layout ngayon —
  // hindi na ito bahagi ng ParentDashboardContext (verify-match
  // flow na lang ang naka-context).
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);
  const openLinkModal = () => setLinkModalOpen(true);
  const closeLinkModal = () => setLinkModalOpen(false);

  const {
    isVerifyModalOpen,
    pendingMatch,
    linkError,
    submitLinkForm,
    confirmMatch,
    rejectMatch,
  } = useParentDashboard();

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
          navItems={PARENT_NAV_ITEMS}
          helpItem={PARENT_HELP_ITEM}
          homeTo="/parent"
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
          <Outlet context={{ ...theme, openLinkModal }} />
        </main>
      </div>

      {/* Shared modals — makikita anuman ang child route (dashboard, enrolled-children, etc) */}
      <LinkStudentModal
        open={isLinkModalOpen}
        onClose={closeLinkModal}
        onSubmit={submitLinkForm}
        error={linkError}
        darkMode={darkMode}
      />

      <VerifyStudentModal
        open={isVerifyModalOpen}
        match={pendingMatch}
        onClose={rejectMatch}
        onConfirm={confirmMatch}
        onReject={rejectMatch}
        darkMode={darkMode}
      />
    </div>
  );
}
