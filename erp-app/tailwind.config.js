/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '360px',   // 작은 모바일 (Galaxy S8, S9)
        'sm': '640px',   // 큰 모바일 가로모드
        'md': '768px',   // 태블릿
        'lg': '1024px',  // 데스크탑
        'xl': '1280px',  // 큰 데스크탑
        '2xl': '1536px', // 매우 큰 화면
      },
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
      }
    },
  },
  plugins: [],
}

