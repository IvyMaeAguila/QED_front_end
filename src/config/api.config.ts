// Vite selects .env.development for the dev server and .env.production for builds.
export const API_CONFIG = {
  baseURL: (import.meta.env.VITE_API_BASE_URL || "https://thesis-qed-1.onrender.com").replace(/\/+$/, ""),
};
