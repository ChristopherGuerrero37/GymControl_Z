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
        canvas: {
          DEFAULT: '#0F131C',
          card: '#161B26',
          border: '#232A3B',
          hover: '#1D2433'
        },
        primary: {
          DEFAULT: '#0AFEDF',
          dark: '#08C7AE',
          glow: 'rgba(10, 254, 223, 0.25)'
        },
        kinetic: {
          DEFAULT: '#4AE176',
          dark: '#38B25D',
          glow: 'rgba(74, 225, 118, 0.25)'
        },
        danger: {
          DEFAULT: '#FF4A6B',
          glow: 'rgba(255, 74, 107, 0.25)'
        },
        warning: {
          DEFAULT: '#FBBF24',
          glow: 'rgba(251, 191, 36, 0.25)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      }
    },
  },
  plugins: [],
}
