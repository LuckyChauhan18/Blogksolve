// Central API base URL — reads from environment variable
// Local dev:   uses http://localhost:5000  (from .env)
// Production:  uses your Render URL        (from .env.production / Vercel env settings)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_URL;
