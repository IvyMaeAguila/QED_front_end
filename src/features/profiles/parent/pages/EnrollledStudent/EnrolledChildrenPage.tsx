import { useOutletContext } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useParentDashboard } from "../dashboard/context/ParentDashboardContext";
import { useIsMobile } from "../../../parent/hooks/usseIsMobile";
import type { ParentOutletContext } from "../ParentLayout";
import { EnrolledChildrenList } from "./Components/EnrolledChildrenLists";
import { LinkStudentForm } from "./Components/LinkStudentForm";

export function EnrolledChildrenPage() {
  // darkMode + openLinkModal both come from the layout
  const { darkMode, openLinkModal } = useOutletContext<ParentOutletContext>();
  const { students, linkError, submitLinkForm, isVerifyModalOpen } =
    useParentDashboard();

  const isMobile = useIsMobile();

  const titleColor = darkMode ? "text-white" : "text-gray-900";
  const subtitleColor = darkMode ? "text-gray-400" : "text-gray-500";
  const panelSurface = darkMode
    ? "border border-[#1F2937] bg-[#111827] shadow-sm"
    : "border border-gray-200 bg-white shadow-sm";
  const dividerColor = darkMode ? "border-white/10" : "border-black/5";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col">
      {/* Page header */}
      <header className="mb-6 flex items-center gap-3 sm:gap-4 lg:mb-8">
        <div className="min-w-0">
          <h1
            className={`text-2xl font-extrabold tracking-tight sm:text-2xl ${titleColor}`}
          >
            Enrolled Children
          </h1>
          <p className={`mt-0.5 text-xs sm:text-sm ${subtitleColor}`}>
            View your linked students and connect new ones to monitor their
            progress.
          </p>
        </div>
      </header>

      {/* One single card holding both the form and the linked students */}
      <section
        className={`self-start w-full overflow-hidden rounded-2xl ${panelSurface} ${
          isMobile ? "" : "grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)]"
        }`}
      >
        {/* LEFT (desktop): inline link form */}
        {!isMobile && (
          <LinkStudentForm
            submitLinkForm={submitLinkForm}
            linkError={linkError}
            darkMode={darkMode}
            isVerifyModalOpen={isVerifyModalOpen}
          />
        )}

        {/* RIGHT: linked children */}
        <div
          className={
            isMobile ? "" : `border-t lg:border-l lg:border-t-0 ${dividerColor}`
          }
        >
          <EnrolledChildrenList students={students} darkMode={darkMode} />
        </div>
      </section>

      {/* Mobile: button opens the layout's overlay */}
      {isMobile && (
        <button
          type="button"
          onClick={openLinkModal}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-maroon-dark px-4 py-4 text-sm font-semibold text-white hover:bg-maroon"
        >
          <UserPlus size={18} />
          Link Student
        </button>
      )}
    </div>
  );
}
