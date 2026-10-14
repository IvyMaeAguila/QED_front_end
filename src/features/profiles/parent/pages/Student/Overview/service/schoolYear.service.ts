import { parentFetch } from '../../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { API_CONFIG } from '../../../../../../../config/api.config';

const API_BASE_URL = `${API_CONFIG.baseURL}`;

export interface SchoolYearMonthsResponse {
  success: boolean;
  message?: string;
  data?: {
    school_year_id: number;
    term1_start: string;
    last_term_end: string;
    months: { month: number; year: number }[];
  };
}

export interface MonthOption {
  key: string;
  label: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toMonthOption(month: number, year: number): MonthOption {
  const mm = String(month).padStart(2, "0");
  return { key: `${year}-${mm}`, label: `${MONTH_NAMES[month - 1]} ${year}` };
}

export async function fetchParentSchoolYear(options?: ApiRequestOptions) {
  const response = await parentFetch(`${API_BASE_URL}/api/sy_term`, options);
  const result: SchoolYearMonthsResponse = await response.json();
  if(!result.success || !result.data) throw new Error(result.message || 'Failed to fetch school year months.');
  return { id: result.data.school_year_id ?? null, months: result.data.months.map(m => toMonthOption(m.month, m.year)) };
}
const SchoolYearService = {
  async getSchoolYearMonths(options?: ApiRequestOptions): Promise<MonthOption[]> { return (await fetchParentSchoolYear(options)).months; },
};
export default SchoolYearService;
