/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--app-bg, #eafbf3)',
          surface: 'var(--app-surface, #f8fffb)',
          text: 'var(--app-text, #0d2f1f)',
          muted: 'var(--app-muted, #4d735f)',
          line: 'var(--app-line, #b8f0d0)',
          accent: 'var(--app-accent, #2ed67d)',
          accentText: 'var(--app-accent-text, #ffffff)',
          warn: '#0f8f4d',
          danger: '#b91c1c'
        }
      },
      boxShadow: {
        soft: '0 18px 42px rgba(15, 143, 77, 0.09)'
      }
    }
  },
  plugins: []
};
