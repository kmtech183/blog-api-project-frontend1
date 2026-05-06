// config.js - Configuration file that can be edited without touching code
const CONFIG = {
  // Change this to your backend URL when deploying
  API_URL: "http://localhost:5000/api",

  // For production, uncomment and set your actual backend URL
  // API_URL: 'https://your-backend-api.com/api',

  // For relative path (if backend and frontend share domain)
  // API_URL: '/api',
};

// Override with environment variable if available (for advanced setups)
if (typeof process !== "undefined" && process.env?.VITE_API_URL) {
  CONFIG.API_URL = process.env.VITE_API_URL;
}
