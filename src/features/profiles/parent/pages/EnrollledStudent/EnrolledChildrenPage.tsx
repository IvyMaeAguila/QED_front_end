import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useParentDashboard } from "../dashboard/context/ParentDashboardContext";
import { useIsMobile } from "../../../parent/hooks/usseIsMobile";
import LinkStudentModal from "./modal/linkStudentModal";
import VerifyStudentModal from "./modal/verifyStudentModal";
import type { AdminThemeContext } from "../../../../profiles/admin/pages/AdminLayout";
import { EnrolledChildrenList } from "./Components/EnrolledChildrenLists";
import { LinkStudentForm } from "./Components/LinkStudentForm";

export function EnrolledChildrenPage() {
  const { darkMode } = useOutletContext<AdminThemeContext>();
  const {
    students,
    linkError,
    submitLinkForm,
    isVerifyModalOpen,
    pendingMatch,
    confirmMatch,
    rejectMatch,
  } = useParentDashboard();

  const isMobile = useIsMobile();

  // Sa mobile, modal ang bahalang mag-hawak ng sarili niyang form state
  // (LinkStudentModal), kaya isang boolean na lang ang kailangan dito
  // para malaman kung bukas ba yun.
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);

  // Kapag na-verify na (match found) mula sa mobile modal, isara na rin
  // ito para hindi na nakapatong sa Verify modal.
  useEffect(() => {
    if (isVerifyModalOpen) {
      setLinkModalOpen(false);
    }
  }, [isVerifyModalOpen]);

  const titleColor = darkMode ? "text-white" : "text-gray-900";
  const dividerColor = darkMode ? "bg-[#1F2937]" : "bg-gray-200";

  return (
    <div className="flex h-full flex-col p-6">
      <h1 className={`mb-6 text-xl font-semibold ${titleColor}`}>
        Enrolled Children
      </h1>

      <div
        className={`flex-1 ${
          isMobile ? "" : "grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1px_1fr]"
        }`}
      >
        {/* KALIWA: listahan ng mga naka-link na anak */}
        <EnrolledChildrenList students={students} darkMode={darkMode} />

        {/* Sa mobile: WALA nang inline form at divider dito. */}
        {!isMobile && (
          <>
            <div className={`h-px w-full lg:h-full lg:w-px ${dividerColor}`} />

            {/* KANAN: link student form (desktop only) */}
            <LinkStudentForm
              submitLinkForm={submitLinkForm}
              linkError={linkError}
              darkMode={darkMode}
              isVerifyModalOpen={isVerifyModalOpen}
            />
          </>
        )}
      </div>

      {/* Sa mobile: button na lang sa ibaba, saka pa lalabas ang modal */}
      {isMobile && (
        <button
          type="button"
          onClick={() => setLinkModalOpen(true)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-maroon-dark px-4 py-4 text-sm font-semibold text-white hover:bg-maroon"
        >
          <UserPlus size={18} />
          Link Student
        </button>
      )}

      {isMobile && (
        <LinkStudentModal
          open={isLinkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          onSubmit={submitLinkForm}
          error={linkError}
          darkMode={darkMode}
        />
      )}

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
