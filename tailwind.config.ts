import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette – warm earth tones
        background:               '#fff8f4',
        'on-background':          '#1e1b18',
        surface:                  '#fff8f4',
        'surface-dim':            '#e0d9d3',
        'surface-bright':         '#fff8f4',
        'surface-container-lowest': '#ffffff',
        'surface-container-low':  '#faf2ed',
        'surface-container':      '#f4ece7',
        'surface-container-high': '#efe7e1',
        'surface-container-highest': '#e9e1dc',
        'surface-variant':        '#e9e1dc',
        'on-surface':             '#1e1b18',
        'on-surface-variant':     '#58423b',
        // Primary – burnt sienna
        primary:                  '#942e02',
        'primary-container':      '#b5451b',
        'on-primary':             '#ffffff',
        'on-primary-container':   '#ffe4dc',
        'primary-fixed':          '#ffdbd0',
        'primary-fixed-dim':      '#ffb59d',
        'on-primary-fixed':       '#390c00',
        'on-primary-fixed-variant': '#832600',
        // Secondary – warm neutral
        secondary:                '#635e58',
        'secondary-container':    '#e6ded7',
        'on-secondary':           '#ffffff',
        'on-secondary-container': '#67625c',
        'secondary-fixed':        '#e9e1da',
        'secondary-fixed-dim':    '#cdc5be',
        'on-secondary-fixed':     '#1e1b17',
        'on-secondary-fixed-variant': '#4a4641',
        // Outline
        outline:                  '#8b7169',
        'outline-variant':        '#dfc0b6',
        // Error
        error:                    '#ba1a1a',
        'error-container':        '#ffdad6',
        'on-error':               '#ffffff',
        'on-error-container':     '#93000a',
        // Inverse
        'inverse-surface':        '#33302c',
        'inverse-on-surface':     '#f7efea',
        'inverse-primary':        '#ffb59d',
        // Surface tint
        'surface-tint':           '#a63b10',
        // Tertiary (reserved)
        tertiary:                 '#005685',
        'tertiary-container':     '#006faa',
        'on-tertiary':            '#ffffff',
        'on-tertiary-container':  '#dcecff',
        'tertiary-fixed':         '#cde5ff',
        'tertiary-fixed-dim':     '#94ccff',
        'on-tertiary-fixed':      '#001d32',
        'on-tertiary-fixed-variant': '#004b74',
        // Success / custom
        success:                  '#2D7A4F',
        'on-success':             '#ffffff',
        // Dark surface (hero, footer, ticker)
        'dark-surface':           '#1A1714',
        'dark-surface-dim':       '#141210',
        // Admin bg
        admin:                    '#F4F2EF',
      },
      fontFamily: {
        headline: ['Noto Serif', 'serif'],
        serif:    ['Playfair Display', 'serif'],
        body:     ['Plus Jakarta Sans', 'sans-serif'],
        label:    ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        sm:      '0.125rem',
        md:      '0.25rem',
        lg:      '0.25rem',
        xl:      '0.5rem',
        '2xl':   '0.75rem',
        full:    '9999px',
      },
      boxShadow: {
        ambient: '0 20px 40px rgba(30, 27, 24, 0.05)',
        lift:    '0 8px 24px rgba(26, 23, 20, 0.10)',
        float:   '0 4px 12px rgba(30, 27, 24, 0.08)',
      },
      animation: {
        ticker: 'ticker 40s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'cart-bounce': 'cart-bounce 0.4s ease',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.4s ease',
      },
      keyframes: {
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':       { opacity: '0.5', transform: 'scale(1.4)' },
        },
        'cart-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '30%':       { transform: 'scale(1.3)' },
          '60%':       { transform: 'scale(0.9)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
