/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#d9e4ff',
          200: '#b3c7ff',
          300: '#8da6ff',
          400: '#627cff',
          500: '#1e40ff', // primary blue
          600: '#1e3aee',
          700: '#1c2ebc',
          800: '#1a238a',
          900: '#0f1a5c',
        },
        dark: {
          900: '#0a0e1a',
          800: '#0f172a',
          700: '#111827',
          600: '#1f2937',
          500: '#374151',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
