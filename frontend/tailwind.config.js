export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Indigo-600
          hover: '#4338CA',   // Indigo-700
        },
        secondary: {
          DEFAULT: '#475569', // Slate-600
          hover: '#334155',   // Slate-700
        },
        accent: {
          DEFAULT: '#10B981', // Emerald-500
          hover: '#059669',   // Emerald-600
        },
        info: '#0EA5E9',
        success: '#10B981', // Emerald
        warning: '#F59E0B',
        error: '#EF4444',
        background: '#F8FAFC',
        surface: '#FFFFFF',
      }
    }
  },

  plugins: [],
  corePlugins: {
    preflight: false, // Disable Tailwind's reset to avoid conflicts with Ant Design
  },
}
