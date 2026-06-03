/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#FDF3EA',
          100: '#FBE7D6',
          200: '#F5CFAD',
          300: '#EEB080',
          400: '#E59154',
          500: '#D4743C',
          600: '#C0652F',
          700: '#9E4F28',
          800: '#7E4024',
          900: '#683720',
        },
      },
    },
  },
  plugins: [],
}
