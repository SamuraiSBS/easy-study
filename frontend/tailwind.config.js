/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--app-bg, #f6f7f4)',
          surface: 'var(--app-surface, #ffffff)',
          text: 'var(--app-text, #1f2933)',
          muted: 'var(--app-muted, #64748b)',
          line: 'var(--app-line, #dbe3dc)',
          accent: 'var(--app-accent, #0f8b8d)',
          accentText: 'var(--app-accent-text, #ffffff)',
          warn: '#b7791f',
          danger: '#b91c1c'
        }
      },
      boxShadow: {
        soft: '0 10px 24px rgba(31, 41, 51, 0.08)'
      }
    }
  },
  plugins: []
};

