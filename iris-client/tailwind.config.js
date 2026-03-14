/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'void': '#020408',
        'surface': '#060d16',
        'panel': '#0a1520',
        'elevated': '#0f1e2e',
        'border': '#112030',
        'border2': '#1a3048',
        'teal': '#00ffe0',
        'teal2': '#00b8a0',
        'amber': '#ffb800',
        'red': '#ff3d5a',
        'green': '#00e87a',
        'blue': '#4d9fff',
        'purple': '#b06fff',
        'text': '#d4e4f0',
        'text2': '#5a7a94',
        'text3': '#2e4a60',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'sans': ['Syne', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1.4s ease-in-out infinite',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 6px currentColor' },
          '50%': { opacity: 0.3, boxShadow: 'none' }
        }
      }
    },
  },
  plugins: [],
}
