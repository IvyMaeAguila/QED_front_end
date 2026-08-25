import { useEffect, useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import type { LinkStudentInput } from "../../dashboard/types/student";

const emptyForm: LinkStudentInput = {
  idNumber: "",
  lastName: "",
  firstName: ""
};

interface LinkStudentFormProps {
  submitLinkForm: (form: LinkStudentInput) => void;
  linkError: string | null;
  darkMode: boolean;
  // Ipina-pasa mula sa parent para malaman kung kailan i-reset
  // ang form (pagka-match sa Verify modal).
  isVerifyModalOpen: boolean;
}

export function LinkStudentForm({
  submitLinkForm,
  linkError,
  darkMode,
  isVerifyModalOpen,
}: LinkStudentFormProps) {
  const [form, setForm] = useState<LinkStudentInput>(emptyForm);

  // I-reset ang form pagka-match, wala nang dala-dalang lumang values
  // pag bumalik ang user sa form.
  useEffect(() => {
    if (isVerifyModalOpen) {
      setForm(emptyForm);
    }
  }, [isVerifyModalOpen]);

  const update =
    (field: keyof LinkStudentInput) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitLinkForm(form);
  };

  const titleColor = darkMode ? "text-white" : "text-gray-900";
  const mutedColor = darkMode ? "text-gray-400" : "text-gray-500";
  const labelColor = darkMode ? "text-gray-400" : "text-gray-600";
  const inputClasses = darkMode
    ? "w-full rounded-lg border border-[#1F2937] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none transition-colors focus:border-maroon focus:ring-1 focus:ring-maroon"
    : "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-maroon focus:ring-1 focus:ring-maroon";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <UserPlus size={16} className={mutedColor} />
        <h2 className={`text-sm font-semibold ${titleColor}`}>
          Link a Student
        </h2>
      </div>
      <p className={`text-xs ${mutedColor}`}>
        Enter student credentials to monitor academic records.
      </p>

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
            <label
              className={`mb-1 block text-xs font-semibold ${labelColor}`}
            >
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
            <label
              className={`mb-1 block text-xs font-semibold ${labelColor}`}
            >
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

        {linkError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {linkError}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-maroon-dark py-2.5 text-sm font-semibold text-white transition-colors hover:bg-maroon"
        >
          Connect Student
        </button>
      </form>
    </div>
  );
}