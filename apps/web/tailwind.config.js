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
        navy: {
          950: '#060B18',
          900: '#0B132B',
          800: '#152238',
          700: '#1C2541',
          600: '#2A3B5C',
          500: '#3A506B',
        },
        ops: {
          surface: '#0B132B',
          card: '#111C38',
          cardHover: '#162447',
          border: '#1E2D52',
          subtle: '#2A3C66',
          accent: '#3A86FF',
          accentHover: '#2563EB',
          cyan: '#48CAE4',
          danger: '#EF4444',
          dangerBg: 'rgba(239, 68, 68, 0.12)',
          warning: '#F59E0B',
          warningBg: 'rgba(245, 158, 11, 0.12)',
          success: '#10B981',
          successBg: 'rgba(16, 185, 129, 0.12)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
};
