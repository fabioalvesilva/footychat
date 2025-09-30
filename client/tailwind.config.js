module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00C896',     // Verde Playtomic
        secondary: '#1A1E2E',   // Azul escuro
        accent: '#FF6B35',      // Laranja para CTAs
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      height: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-bottom))',
      }
    },
  },
  plugins: [],
}