/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        mw: {
          red: '#e5332a',
          ink: '#111827',
          slate: '#4b5563',
        },
      },
    },
  },
  plugins: [],
}
