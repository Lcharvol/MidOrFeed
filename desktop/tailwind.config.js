/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // League of Legends inspired colors
        'lol-gold': '#C89B3C',
        'lol-gold-dark': '#785A28',
        'lol-blue': '#0A1428',
        'lol-blue-light': '#0AC8B9',
        'lol-hextech': '#0397AB',
      },
    },
  },
  plugins: [],
};
