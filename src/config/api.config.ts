const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) throw new Error('Missing VITE_API_BASE_URL');

export const API_CONFIG = {
  baseURL: API_BASE_URL,
};
