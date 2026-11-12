import { useState } from "react";
import { ConfirmationModal } from "@shared/components/ConfirmationModal";
import { useToast } from "@shared/context/ToastContext";

export function DeleteAuditEntry({ remove, darkMode }: { remove: () => Promise<void>; darkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  return (
    <>
      <button type="button" className="font-semibold text-red-700 hover:underline dark:text-red-300" onClick={() => setOpen(true)}>
        Delete audit entry
      </button>
      {open && (
        <ConfirmationModal
          title="Delete this audit entry?"
          description="This removes the entry from the audit log. QED keeps a record of the deletion."
          darkMode={darkMode}
          variant="danger"
          confirmLabel="Delete entry"
          loadingLabel="Deleting…"
          onClose={() => setOpen(false)}
          onConfirm={async () => {
            await remove();
            setOpen(false);
            showToast("Audit entry deleted.", "success");
          }}
        />
      )}
    </>
  );
}
