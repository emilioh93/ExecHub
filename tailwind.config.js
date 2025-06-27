/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          500: '#1a73e8',
          600: '#1557b0',
          700: '#0f4185'
        },
        sidebar: '#f1f3f4',
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107'
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif']
      }
    },
  },
  plugins: [],
} 