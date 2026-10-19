/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        celebra: {
          gold: '#B08D57',
          dark: 'rgb(var(--c-ink) / <alpha-value>)',
          cream: 'rgb(var(--c-surface) / <alpha-value>)',
          paper: 'rgb(var(--c-paper) / <alpha-value>)',
          night: '#1F2937',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
