/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0aa344',
          dark: '#078a38',
          light: '#eef7f0',
          glow: 'rgba(10, 163, 68, 0.35)',
        },
        dark: {
          bg: '#0b0f17',
          card: '#131926',
          border: '#1f293d',
        },
      },
      animation: {
        'shimmer': 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'border-beam': 'borderBeam 6s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        borderBeam: {
          '100%': { offsetDistance: '100%' },
        },
      },
    },
  },
  plugins: [],
};
