/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0b0f1a',
        neon: {
          cyan: '#22d3ee',
          pink: '#f472b6',
          purple: '#a78bfa',
          yellow: '#facc15',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 20px rgba(34, 211, 238, 0.55), 0 0 60px rgba(167, 139, 250, 0.25)',
      },
    },
  },
  plugins: [],
}
