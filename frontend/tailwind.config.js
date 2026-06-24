/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2015ff',
        'primary-dark': '#1a10d4',
        'primary-light': '#4035ff',
      },
    },
  },
  plugins: [],
}