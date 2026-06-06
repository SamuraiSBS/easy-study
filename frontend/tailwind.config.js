/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--app-bg, #effbf5)',
          surface: 'var(--app-surface, #f8fffb)',
          text: 'var(--app-text, #0b2f1d)',
          muted: 'var(--app-muted, #35664d)',
          line: 'var(--app-line, #a7e3bf)',
          accent: 'var(--app-accent, #24b26d)',
          accentText: 'var(--app-accent-text, #ffffff)',
          warn: '#1aa060',
          danger: '#b91c1c'
        }
      },
      boxShadow: {
        soft: '0 18px 42px rgba(18, 132, 79, 0.09)'
      }
    }
  },
  plugins: []
};
