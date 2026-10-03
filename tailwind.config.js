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
          dark: '#000000',
          card: 'rgba(10, 10, 10, 0.92)',
          cardBorder: 'rgba(255, 255, 255, 0.16)',
          accent: '#ffffff',
          cyan: '#e4e4e7',
          neon: '#ffffff',
          glow: 'rgba(255, 255, 255, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 15px -3px rgba(255, 255, 255, 0.15)',
        'glow-blue': '0 0 20px -4px rgba(255, 255, 255, 0.2)',
        'hud-border': '0 0 0 1px rgba(255, 255, 255, 0.16), 0 8px 32px 0 rgba(0, 0, 0, 0.6)'
      }
    },
  },
  plugins: [],
}
