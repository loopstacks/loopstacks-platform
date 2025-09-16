/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        },
        accent: {
          500: '#00d4ff',
          600: '#00b8d4'
        },
        success: {
          500: '#10b981',
          600: '#059669'
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706'
        },
        error: {
          500: '#ef4444',
          600: '#dc2626'
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3b82f6, #00d4ff)',
        'gradient-success': 'linear-gradient(135deg, #10b981, #34d399)',
        'gradient-warning': 'linear-gradient(135deg, #f59e0b, #fbbf24)',
        'gradient-error': 'linear-gradient(135deg, #ef4444, #f87171)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      animation: {
        'status-pulse': 'pulse 2s infinite',
      }
    },
  },
  plugins: [],
}