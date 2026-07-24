/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12100E',
        surface: '#1C1815',
        surface2: '#241F1A',
        brass: '#C8963E',
        brassLight: '#E4C878',
        teal: '#4FB6A6',
        cream: '#F2ECE1',
        muted: '#8A8175',
        line: '#332C24',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      keyframes: {
        spin18: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        vinyl: 'spin18 6s linear infinite',
      },
    },
  },
  plugins: [],
}
