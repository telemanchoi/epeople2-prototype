/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F4FF',
          100: '#D9E2FC',
          200: '#B3C5F9',
          300: '#7A9BF4',
          400: '#4A73E8',
          500: '#1E40AF',
          600: '#0F2D7A',
          700: '#0F172A',
          800: '#0B1120',
          900: '#060A14',
        },
        cta: {
          50: '#E8F4FA',
          100: '#C5E4F5',
          200: '#8EC9EA',
          300: '#4AADE0',
          400: '#1490C8',
          500: '#0369A1',
          600: '#025581',
          700: '#013F60',
        },
        epeople: {
          50: '#E6F7FA',
          100: '#B3E8F0',
          500: '#0891B2',
          600: '#0E7490',
          700: '#155E75',
        },
      },
      fontFamily: {
        arabic: ['Noto Sans Arabic', 'Arial', 'sans-serif'],
        latin: ['Inter', 'Arial', 'sans-serif'],
        korean: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
