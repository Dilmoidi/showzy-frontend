/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cyber-cyan': '#00f2fe',
        'cyber-magenta': '#ff007f',
        'cyber-purple': '#7b2cbf',
        'bg-primary': '#06070d',
        'bg-secondary': '#0d0f1e',
        'bg-tertiary': '#14172e',
        'text-primary': '#f1f3f9',
        'text-secondary': '#8e9bb3',
        'seat-available': '#2c3258',
        'seat-selected': '#00f2fe',
        'seat-locked': '#ff007f',
        'seat-booked': '#121424',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        cyber: ['Orbitron', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 242, 254, 0.4)',
        'neon-magenta': '0 0 15px rgba(255, 0, 127, 0.4)',
      },
    },
  },
  plugins: [],
}
