export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0e14',
          900: '#0f1419',
          800: '#161b22',
          700: '#1f2630',
          600: '#2d3744',
          500: '#4a5568',
        },
        accent: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        paper: {
          DEFAULT: '#F7F4ED',
          warm: '#F1ECE0',
          line: '#E0D9C8',
        },
        rust: {
          DEFAULT: '#C2491D',
          soft: '#E8C9B8',
        },
        slate: {
          ink: '#1C1F26',
          soft: '#3D4A5C',
        },
        moss: '#4F6F52',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        serif: ['Fraunces', 'serif'],
      },
    },
  },
  plugins: [],
}
