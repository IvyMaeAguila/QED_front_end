import { UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { LinkStudentInput } from "../../dashboard/types/student";
import Modal from "../../ui/modal";

interface LinkStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: LinkStudentInput) => void;
  error?: string | null;
  darkMode?: boolean;
}

const emptyForm: LinkStudentInput = {
  idNumber: "",
  lastName: "",
  firstName: "",
};

export default function LinkStudentModal({
  open,
  onClose,
  onSubmit,
  error,
  darkMode = false,
}: LinkStudentModalProps) {
  const [form, setForm] = useState<LinkStudentInput>(emptyForm);

  const update =
    (field: keyof LinkStudentInput) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const handleClose = () => {
    setForm(emptyForm);
    onClose();
  };

  const labelColor = darkMode ? "text-gray-400" : "text-gray-600";
  const inputClasses = darkMode
    ? "w-full rounded-lg border border-[#1F2937] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none transition-colors focus:border-maroon focus:ring-1 focus:ring-maroon"
    : "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-maroon focus:ring-1 focus:ring-maroon";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Link Student"
      subtitle="Enter student credentials to monitor academic records."
      icon={<UserPlus size={16} />}
      darkMode={darkMode}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={`mb-1 block text-xs font-semibold ${labelColor}`}>
            ID Number
          </label>
          <input
            required
            value={form.idNumber}
            onChange={update("idNumber")}
            placeholder="e.g. 2026-0001"
            className={inputClasses}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className={`mb-1 block text-xs font-semibold ${labelColor}`}>
              Last Name
            </label>
            <input
              required
              value={form.lastName}
              onChange={update("lastName")}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={`mb-1 block text-xs font-semibold ${labelColor}`}>
              First Name
            </label>
            <input
              required
              value={form.firstName}
              onChange={update("firstName")}
              className={inputClasses}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-maroon-dark py-2.5 text-sm font-semibold text-white transition-colors hover:bg-maroon"
        >
          Connect Student
        </button>
      </form>
    </Modal>
  );
}
