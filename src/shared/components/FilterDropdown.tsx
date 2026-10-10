import { AccountSelect } from "@shared/components/AccountSelect";
import { LoadingFormValue } from "@shared/loading/LoadingFormValue";
interface FilterDropdownProps { loading?: boolean; compact?: boolean; label: string; value: string; options: string[]; onChange: (value: string) => void; darkMode: boolean; }
export function FilterDropdown({ loading, label, value, options, onChange, darkMode }: FilterDropdownProps) {
 const control = <AccountSelect data-account-select="" role="button" aria-label={label+": "+value} data-dropdown-dark={darkMode} value={value} onChange={event=>onChange(event.target.value)}>{options.map(option=><option key={option} value={option}>{option}</option>)}</AccountSelect>;
 return loading === undefined ? control : <LoadingFormValue loading={loading} name={"filter-"+label+"-value"} width={label==="Section"?"10ch":"6ch"}>{control}</LoadingFormValue>;
}
