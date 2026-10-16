import { AccountSelect } from "@shared/components/AccountSelect";
export function Dropdown<T extends string>({ label, value, options, onChange, darkMode }: { label: string; value: T; options: T[]; onChange: (value: T) => void; darkMode: boolean }) {
 return <AccountSelect role="button" aria-label={value} aria-description={label} data-dropdown-dark={darkMode} className="min-w-32" value={value} onChange={event=>onChange(event.target.value as T)}>{options.map(option=><option key={option} value={option}>{option}</option>)}</AccountSelect>;
}
