// Vercel serves this browser simulation. The Docker stack opts into real APIs.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';
