import { AccountSelect } from "@shared/components/AccountSelect";


interface GradeLevelFilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  darkMode: boolean;
}

export function GradeLevelFilterDropdown({
  label,
  value,
  options,
  onChange,
  darkMode,
}: GradeLevelFilterDropdownProps) {
  return (
    <div className="relative shrink-0">
      <AccountSelect data-account-select=""
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`qed-filter-control appearance-none rounded-lg border pl-3 pr-8 font-semibold outline-none transition-colors focus:border-maroon-light ${
          darkMode
            ? "border-white/10 bg-white/5 text-white"
            : "border-gray-200 bg-white text-gray-900"
        }`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </AccountSelect>
    </div>
  );
}
