/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FBF9F5',
          100: '#F7F4ED', // Warm Ivory Surface
          200: '#E9E5DC', // Warm Sand Background
          300: '#D8D2C7', // Subtle Border
          400: '#C2BBB0',
          500: '#A9A093',
        },
        midnight: {
          950: '#0C1526',
          900: '#101B30', // Deep Navy
          800: '#17263F', // Midnight Navy
          700: '#1F3252',
          600: '#2A436D',
        },
        teal: {
          muted: '#167D80', // Muted Teal
          soft: '#8FD2C4',  // Soft Teal
          hover: '#12676A',
          50: '#F0F9F8',
          100: '#D8F1EC',
          500: '#167D80',
          600: '#12676A',
        },
        amber: {
          warning: '#B77936', // Amber Warning
          50: '#FDF8F3',
          100: '#F9EDE0',
          500: '#B77936',
          600: '#A0672C',
        },
        red: {
          critical: '#B94A48', // Critical Red
          50: '#FDF3F3',
          100: '#FBE4E4',
          500: '#B94A48',
          600: '#A13B39',
        },
        ink: {
          main: '#253248',      // Main Text
          secondary: '#667085', // Secondary Text
          muted: '#8A94A6',
          light: '#F7F4ED',
        },
        surface: {
          ivory: '#F7F4ED',
          sand: '#E9E5DC',
          border: '#D8D2C7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'card': '0 2px 6px -1px rgba(23, 38, 63, 0.06), 0 1px 3px -1px rgba(23, 38, 63, 0.04)',
        'card-hover': '0 6px 14px -2px rgba(23, 38, 63, 0.1), 0 2px 6px -1px rgba(23, 38, 63, 0.06)',
        'modal': '0 12px 30px -4px rgba(16, 27, 48, 0.25), 0 4px 12px -2px rgba(16, 27, 48, 0.15)',
      }
    },
  },
  plugins: [],
}
