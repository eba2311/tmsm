/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B4F8A',
          50: '#EBF2FB',
          100: '#C5D9F1',
          200: '#9FBFE8',
          300: '#79A6DE',
          400: '#538CD4',
          500: '#1B4F8A',
          600: '#16437A',
          700: '#113669',
          800: '#0C2957',
          900: '#071C46',
        },
        gold: {
          DEFAULT: '#C9920A',
          light: '#F0B429',
          dark: '#A07208',
        },
        etgreen: { DEFAULT: '#2D7D3A', light: '#3FA84A', dark: '#1F5828' },
        etred: { DEFAULT: '#B5251A', light: '#D42E21', dark: '#8C1C14' },
        sidebar: '#1A2340',
        surface: '#F7F5F0',
        earth: '#8B5E3C',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Ethiopic', 'sans-serif'],
        amharic: ['Noto Sans Ethiopic', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        card: '0 2px 16px rgba(27,79,138,0.08)',
        'card-hover': '0 8px 32px rgba(27,79,138,0.16)',
        glow: '0 0 24px rgba(201,146,10,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(-16px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
