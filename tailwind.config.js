/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      /*
       * Kolory czytane ze zmiennych CSS (src/styles/variables.css), a nie
       * wpisane tutaj na sztywno. Dzięki temu podmiana motywu to podmiana
       * jednego atrybutu na <html> — żadna klasa w komponentach się nie zmienia.
       *
       * `<alpha-value>` to znacznik Tailwinda: wstawia w to miejsce przezroczystość
       * z zapisu `bg-ink/95`. Bez niego takie klasy przestałyby działać, a używamy
       * ich m.in. w gradiencie hero i w tle navbara.
       */
      colors: {
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        dark: 'rgb(var(--c-dark) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        secondary: 'rgb(var(--c-secondary) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
      },
      fontFamily: {
        heading: ['Oswald', 'Arial', 'sans-serif'],
        body: ['Inter', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        content: '1240px',
      },
      spacing: {
        navbar: '80px',
      },
      borderRadius: {
        DEFAULT: '4px',
      },
      letterSpacing: {
        heading: '0.04em',
        wider: '0.12em',
      },
      lineHeight: {
        body: '1.7',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
