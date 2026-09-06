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

// In-memory cache — buong lifetime ng tab/session lang ito nabubuhay.
let cachedMonths: MonthOption[] | null = null;
let inFlightRequest: Promise<MonthOption[]> | null = null;

const SchoolYearService = {
  async getSchoolYearMonths(): Promise<MonthOption[]> {
    if (cachedMonths) {
      return cachedMonths;
    }

    if (inFlightRequest) {
      return inFlightRequest;
    }

    inFlightRequest = (async () => {
      const response = await fetch(`${API_BASE_URL}/api/sy_term`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const result: SchoolYearMonthsResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch school year months.");
      }

      const months = result.data.months.map((m) => toMonthOption(m.month, m.year));
      cachedMonths = months;
      return months;
    })();

    try {
      return await inFlightRequest;
    } finally {
      inFlightRequest = null;
    }
  },

  clearCache() {
    cachedMonths = null;
  },
};

export default SchoolYearService;