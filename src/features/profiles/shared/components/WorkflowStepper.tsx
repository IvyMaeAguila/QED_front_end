import { Check } from "lucide-react";

export interface WorkflowStep {
  name: string;
  desc: string;
}

interface WorkflowStepperProps {
  darkMode: boolean;
  current: number;
  steps: readonly WorkflowStep[];
}

/** Progress indicator shared by parent child-linking and admin multi-step forms. */
export function WorkflowStepper({ darkMode, current, steps }: WorkflowStepperProps) {
  return (
    <ol className="flex md:flex-col" aria-label="Form steps">
      {steps.map(({ name, desc }, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === steps.length - 1;
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
            className={`flex min-w-0 flex-col md:flex-1 md:flex-row md:gap-3 ${
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
            <div className="mt-1.5 min-w-0 md:mt-0 md:pt-1">
              <span
                className={`block whitespace-nowrap text-xs font-semibold md:text-sm md:leading-6 ${labelColor}`}
              >
                {name}
              </span>
              <span className={`hidden text-xs leading-snug md:block ${descColor}`}>
                {desc}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
