import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@shared/components/Sidebar";
import { Header } from "@shared/components/Header";
import { ModalCloseButton, ModalFrame } from "@shared/components/modal";
import { PolygonBackdrop } from "../../shared/components/PolygonLayout";
import { useSettings } from "../../admin/pages/settings/context/SettingsContext";
import { PARENT_NAV_ITEMS, PARENT_HELP_ITEM } from "./config/parentNavItem";
import type { AdminThemeContext } from "../../admin/pages/AdminLayout";
import { useParentDashboard } from "./dashboard/context/ParentDashboardContext";
import VerifyStudentModal from "./EnrollledStudent/modal/verifyStudentModal";
// TODO: adjust this path to wherever you saved LinkStudentForm.tsx
import { LinkStudentForm } from "./EnrollledStudent/Components/LinkStudentForm";

interface ParentLayoutProps {
  onLogout: () => void;
}

// Use this in child routes: useOutletContext<ParentOutletContext>()
export type ParentOutletContext = AdminThemeContext & {
  openLinkModal: () => void;
};

export function ParentLayout({ onLogout }: ParentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode } = useSettings();

  // Link overlay open/close state is local to the layout;
  // only the verify-match flow lives in ParentDashboardContext.
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

  // Close the link overlay with the Escape key
  useEffect(() => {
    if (!isLinkModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isVerifyModalOpen) closeLinkModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLinkModalOpen, isVerifyModalOpen]);

  // Translucent panels so the polygon backdrop shows through
  const theme: AdminThemeContext = {
    darkMode,
    panelBg: darkMode
      ? "bg-[#2A1A18]/90 backdrop-blur-md"
      : "bg-white/85 backdrop-blur-md",
    panelBorder: darkMode ? "border-[#543632]" : "border-[#E5E7EB]",
    textPrimary: darkMode ? "text-white" : "text-[#111827]",
    textMuted: darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]",
  };

  const outletContext: ParentOutletContext = { ...theme, openLinkModal };

  return (
    <div
      className={`qed-account-ui parent-system flex h-dvh w-full overflow-hidden transition-colors ${
        darkMode ? "dark bg-[#1A1110]" : "bg-[#F3F4F6]"
      }`}
    >
      {/* lg:z-0 → on desktop the sidebar sits below <main> (z-10), so modals
          rendered inside <main> (and their backdrop blur) cover it too.
          On mobile it stays z-50 as a slide-in drawer. */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:relative lg:z-0 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
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
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="relative flex h-full flex-1 flex-col overflow-hidden">
        <PolygonBackdrop darkMode={darkMode} />

        <div className="relative z-10">
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            onLogout={onLogout}
            showNotifications
          />
        </div>

        <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet context={outletContext} />
        </main>
      </div>

      {/* Link Student: new form design inside a scrollable overlay */}
      {isLinkModalOpen && (
        <ModalFrame
          shellVariant={darkMode ? "dark" : "standard"}
          onClose={closeLinkModal}
          size="wide"
          ariaLabel="Link a student"
          backdropClassName="items-start bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto sm:max-h-[calc(100dvh-3rem)]"
        >
            <ModalCloseButton
              onClose={closeLinkModal}
              darkMode={darkMode}
              className="absolute right-4 top-4 z-10 rounded-full md:right-5 md:top-5"
            />

            <LinkStudentForm
              submitLinkForm={submitLinkForm}
              linkError={linkError}
              darkMode={darkMode}
              isVerifyModalOpen={isVerifyModalOpen}
            />
        </ModalFrame>
      )}

      {/* Rendered after the overlay so it stacks on top at the same z-index */}
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
