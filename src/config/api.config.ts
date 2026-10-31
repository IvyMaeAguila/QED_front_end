// Production requests use Vercel's /api/* proxy so the HttpOnly login cookie
// belongs to the website itself, including on iOS browsers.
if (!import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  throw new Error('Missing VITE_API_BASE_URL');
}

export const API_CONFIG = {
  baseURL: import.meta.env.PROD ? "" : import.meta.env.VITE_API_BASE_URL,
};
