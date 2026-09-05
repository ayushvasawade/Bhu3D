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
        cadastre: {
          dark: '#070b13',
          card: 'rgba(13, 22, 38, 0.78)',
          cardBorder: 'rgba(56, 189, 248, 0.22)',
          accent: '#0284c7',
          cyan: '#38bdf8',
          neon: '#00f2fe',
          glow: 'rgba(0, 242, 254, 0.35)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(56, 189, 248, 0.4)',
        'glow-blue': '0 0 25px -4px rgba(2, 132, 199, 0.5)',
        'hud-border': '0 0 0 1px rgba(56, 189, 248, 0.35), 0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
