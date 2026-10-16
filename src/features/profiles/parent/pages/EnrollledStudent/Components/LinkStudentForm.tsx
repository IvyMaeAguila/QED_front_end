import { useState, type FormEvent, type ReactNode } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { Check, Hash, User } from "lucide-react";
import type { LinkStudentInput } from "../../dashboard/types/student";

const emptyForm: LinkStudentInput = {
  idNumber: "",
  lastName: "",
  firstName: "",
};

const steps = [
  { name: "Student Details", desc: "Enter your child's details" },
  { name: "Verify", desc: "Confirm the match" },
  { name: "Connected", desc: "Start monitoring progress" },
];

interface LinkStudentFormProps {
  submitLinkForm: (form: LinkStudentInput) => void;
  linkError: string | null;
  darkMode: boolean;
  // Ipina-pasa mula sa parent para malaman kung kailan i-reset
  // ang form (pagka-match sa Verify modal).
  isVerifyModalOpen: boolean;
}

/* ---------- Floating-label field (label sits on the border) ---------- */

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  darkMode: boolean;
  icon?: ReactNode;
  hint?: string;
  autoComplete?: string;
  className?: string;
}

function Field({
  id,
  label,
  value,
  onChange,
  darkMode,
  icon,
  hint,
  autoComplete,
  className = "",
}: FieldProps) {
  const surface = darkMode
    ? "bg-[#111827]"
    : "bg-gray-50";
  const idleBorder = darkMode
    ? "border-[#2a2a2a] hover:border-[#3a3a3a]"
    : "border-gray-200 hover:border-gray-300";
  const text = darkMode ? "text-white" : "text-gray-900";
  const idleLabel = darkMode ? "text-gray-500" : "text-gray-400";
  const idleIcon = darkMode ? "text-gray-600" : "text-gray-300";

  // Label floats up onto the border when focused or filled.
  const floated = value.length > 0;

  return (
    <div className={className}>
      <div className="relative">
        <input
          id={id}
          required
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          // text-base keeps inputs readable and prevents iOS zoom on focus
          className={`peer w-full rounded-xl border py-3.5 pr-4 text-base shadow-sm outline-none transition-colors ${
            icon ? "pl-11" : "pl-4"
          } ${surface} ${text} ${
            floated ? "border-maroon" : idleBorder
          } focus:border-maroon focus:ring-1 focus:ring-maroon`}
        />

        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors peer-focus:text-maroon ${
              floated ? "text-maroon" : idleIcon
            }`}
          >
            {icon}
          </span>
        )}

        <label
          htmlFor={id}
          className={`pointer-events-none absolute px-1 leading-none transition-all duration-150 peer-focus:left-3 peer-focus:top-0 peer-focus:text-xs peer-focus:font-medium peer-focus:text-maroon ${surface} ${
            floated
              ? "left-3 top-0 -translate-y-1/2 text-xs font-medium text-maroon"
              : `top-1/2 -translate-y-1/2 text-sm peer-focus:-translate-y-1/2 ${idleLabel} ${
                  icon ? "left-10" : "left-3"
                }`
          }`}
        >
          {label}
        </label>
      </div>
      {hint && (
        <p
          className={`mt-1.5 px-1 text-xs ${
            darkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

/* ---------- Step indicator ----------
   Mobile:  horizontal (circle — line — circle), label under each circle.
   Desktop: vertical (circle + line stacked), label + description to the right. */

function Stepper({
  darkMode,
  current,
}: {
  darkMode: boolean;
  current: number;
}) {
  return (
    <ol className="flex md:flex-col">
      {steps.map(({ name, desc }, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === steps.length - 1;

        // Neutral greys only, so the maroon never washes out into pink.
        const circle =
          done || active
            ? "bg-maroon text-white"
            : darkMode
              ? "bg-[#2a2626] text-gray-500"
              : "bg-gray-200/80 text-gray-400";

        const ring = active
          ? darkMode
            ? "ring-4 ring-white/10"
            : "ring-4 ring-gray-300/50"
          : "";

        const labelColor = active
          ? darkMode
            ? "text-white"
            : "text-gray-900"
          : darkMode
            ? "text-gray-500"
            : "text-gray-400";

        const descColor = active
          ? darkMode
            ? "text-gray-400"
            : "text-gray-500"
          : darkMode
            ? "text-gray-600"
            : "text-gray-400";

        const line = done
          ? "bg-maroon"
          : darkMode
            ? "bg-[#3a3535]"
            : "bg-gray-300/70";

        return (
          <li
            key={name}
            className={`flex flex-col md:flex-1 md:flex-row md:gap-3 ${
              isLast ? "" : "flex-1 md:flex-none"
            }`}
            aria-current={active ? "step" : undefined}
          >
            <div className="flex items-center md:flex-col">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${circle} ${ring}`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>

              {!isLast && (
                <>
                  <span className={`mx-2 h-px flex-1 md:hidden ${line}`} />
                  <span
                    className={`hidden w-px md:my-1.5 md:block md:min-h-9 md:flex-1 ${line}`}
                  />
                </>
              )}
            </div>

            <div className="mt-1.5 md:mt-0 md:pt-1">
              <span
                className={`block whitespace-nowrap text-xs font-semibold md:text-sm md:leading-6 ${labelColor}`}
              >
                {name}
              </span>
              <span
                className={`hidden text-xs leading-snug md:block ${descColor}`}
              >
                {desc}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Main component ---------- */

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

  const stepperSurface = darkMode
    ? "border border-[#1F2937] bg-[#111827]"
    : "border border-gray-200 bg-gray-50";
  const formSurface = darkMode
    ? "border border-[#1F2937] bg-[#111827]"
    : "border border-gray-200 bg-white";
  const titleColor = darkMode ? "text-white" : "text-gray-900";
  const mutedColor = darkMode ? "text-gray-400" : "text-gray-500";
  const sectionLabel = darkMode ? "text-gray-400" : "text-gray-500";
  const divider = darkMode ? "border-[#2a2a2a]" : "border-gray-200";

  return (
    // No card styling here: the page provides the shared card.
    <div className="w-full p-2 md:p-3">
      <div className="grid gap-2 md:grid-cols-[16rem_1fr] md:gap-3">
        {/* Top bar on mobile / sidebar on desktop */}
        <aside className={`rounded-xl px-4 py-5 md:px-7 md:py-8 ${stepperSurface}`}>
          <div className="mb-5 flex items-center gap-2.5 md:mb-8 md:block">
            <h2 className={`text-base font-semibold md:text-lg ${titleColor}`}>
              Link a Student
            </h2>
          </div>
          <Stepper darkMode={darkMode} current={0} />
        </aside>

        {/* Form panel */}
        <div
          className={`flex flex-col rounded-xl px-4 py-6 sm:px-6 md:px-10 md:py-8 ${formSurface}`}
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col justify-between gap-6"
          >
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${sectionLabel}`}
                >
                  Student credentials
                </p>
                <p className={`text-xs ${mutedColor}`}>Step 1 of 3</p>
              </div>

              <Field
                id="link-id-number"
                label="ID Number"
                value={form.idNumber}
                onChange={update("idNumber")}
                darkMode={darkMode}
                icon={<Hash size={16} />}
                hint="Example: 2026-0001"
                autoComplete="off"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  id="link-first-name"
                  label="First Name"
                  value={form.firstName}
                  onChange={update("firstName")}
                  darkMode={darkMode}
                  icon={<User size={16} />}
                  autoComplete="off"
                />
                <Field
                  id="link-last-name"
                  label="Last Name"
                  value={form.lastName}
                  onChange={update("lastName")}
                  darkMode={darkMode}
                  icon={<User size={16} />}
                  autoComplete="off"
                />
              </div>

              <p className={`text-sm leading-relaxed ${mutedColor}`}>
                Enter the student's details exactly as they appear in school
                records so we can match and monitor their academic progress.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {linkError && (
                <p
                  role="alert"
                  className={`rounded-lg border px-4 py-2.5 text-xs font-medium ${
                    darkMode
                      ? "border-red-900/50 bg-[#1f1717] text-red-400"
                      : "border-red-200 bg-white text-red-700"
                  }`}
                >
                  {linkError}
                </p>
              )}

              <div className={`flex border-t pt-5 sm:justify-end ${divider}`}>
                <button
                  type="submit"
                  className="w-full rounded-full bg-maroon-dark px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-all hover:bg-maroon active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon focus-visible:ring-offset-2 sm:w-auto sm:py-2.5"
                >
                  Connect Student
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
