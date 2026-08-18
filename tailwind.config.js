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
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          card: 'var(--color-bg-card)',
          hover: 'var(--color-bg-hover)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        accent: {
          orange: 'var(--color-accent-orange)',
          orangeHover: 'var(--color-accent-orange-hover)',
          navy: 'var(--color-accent-navy)',
          navyHover: 'var(--color-accent-navy-hover)',
          green: 'var(--color-accent-green)',
          greenHover: 'var(--color-accent-green-hover)',
          yellow: 'var(--color-accent-yellow)',
          yellowHover: 'var(--color-accent-yellow-hover)',
        },
        border: {
          primary: 'var(--color-border-primary)',
          secondary: 'var(--color-border-secondary)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        premium: '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        glass: '0 1px 3px 0 rgba(16, 24, 40, 0.08)',
      }
    },
  },
  plugins: [],
}
