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
          },
          organic: {
            cream: '#fdfbf9',
            peach: '#fff5f5',
            sand: '#f9f6f0',
            blush: '#fff0f6',
            mint: '#f0fdf4',
            lavender: '#f8f5ff',
          }
        },
        boxShadow: {
          'soft-xs': '0 2px 10px -1px rgba(229, 91, 186, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
          'soft-sm': '0 6px 20px -3px rgba(229, 91, 186, 0.09), 0 2px 8px -2px rgba(0, 0, 0, 0.03)',
          'soft-md': '0 12px 32px -4px rgba(229, 91, 186, 0.12), 0 4px 14px -2px rgba(0, 0, 0, 0.04)',
          'soft-lg': '0 22px 48px -6px rgba(229, 91, 186, 0.16), 0 8px 24px -4px rgba(0, 0, 0, 0.05)',
          'soft-glow': '0 0 25px 4px rgba(229, 91, 186, 0.28)',
          'soft-inner': 'inset 0 2px 6px 0 rgba(229, 91, 186, 0.06)',
        },
        borderRadius: {
          '4xl': '2rem',
          '5xl': '2.5rem',
        },
        fontFamily: {
          playfair: ["Playfair Display", "serif"],
          sans: ["DM Sans", "sans-serif"],
        },
      },
    },
    plugins: [],
  }