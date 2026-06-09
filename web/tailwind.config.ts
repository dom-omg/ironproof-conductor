import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040d1a',
          900: '#0a1628',
          800: '#0f2040',
          700: '#162d5a',
        },
        gold: {
          400: '#e8c878',
          500: '#c8a84b',
          600: '#a88830',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
