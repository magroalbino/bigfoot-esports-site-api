/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      colors: {
        'lol-gold': '#C89B3C',
        'lol-blue': '#C89B3C', // Corrigido: parece que lol-blue está usando a mesma cor que lol-gold
        'lol-dark': '#010A13',
      },
    },
  },
  plugins: [],
};
