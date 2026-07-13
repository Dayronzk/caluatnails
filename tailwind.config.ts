/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          rose: {
            50: '#fdf2f9',
            100: '#fce7f4',
            200: '#fac4e5',
            300: '#f695d1',
            400: '#f47394',
            500: '#e55bba',
            600: '#d03ca3',
            700: '#b22687',
            800: '#932270',
            900: '#7a205f',
            950: '#4a0d37',
          }
        },
        fontFamily: {
          playfair: ["Playfair Display", "serif"],
          sans: ["DM Sans", "sans-serif"],
        },
      },
    },
    plugins: [],
  }