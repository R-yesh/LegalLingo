/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        'surface-subtle': '#F1F5F9',
        charcoal: {
          DEFAULT: '#0F172A',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        steel: {
          DEFAULT: '#64748B',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        status: {
          verified: {
            bg: '#ECFDF5',
            border: '#A7F3D0',
            text: '#065F46',
            badge: '#10B981',
          },
          standard: {
            bg: '#EFF6FF',
            border: '#BFDBFE',
            text: '#1E40AF',
            badge: '#3B82F6',
          },
          review: {
            bg: '#FFFBEB',
            border: '#FDE68A',
            text: '#92400E',
            badge: '#F59E0B',
          },
          attention: {
            bg: '#FFF1F2',
            border: '#FECDD3',
            text: '#9F1239',
            badge: '#E11D48',
          },
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'diffused': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
        'diffused-lg': '0 30px 60px -20px rgba(0, 0, 0, 0.08)',
        'whisper': '0 2px 10px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
}
