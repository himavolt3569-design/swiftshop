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
        /* ── Brand palette – warm earth tones + 2026 dopamine accents ── */
        background:               '#FFFAF6',
        'on-background':          '#1A1714',
        surface:                  '#FFFAF6',
        'surface-dim':            '#E8E0D9',
        'surface-bright':         '#FFFAF6',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low':  '#FBF3EE',
        'surface-container':      '#F5ECE6',
        'surface-container-high': '#EFE6E0',
        'surface-container-highest': '#E9E0DA',
        'surface-variant':        '#E9E0DA',
        'on-surface':             '#1A1714',
        'on-surface-variant':     '#55413A',

        /* Primary – refined burnt sienna */
        primary:                  '#A63B10',
        'primary-container':      '#C4501F',
        'on-primary':             '#FFFFFF',
        'on-primary-container':   '#FFE6DC',
        'primary-fixed':          '#FFDBD0',
        'primary-fixed-dim':      '#FFB59D',
        'on-primary-fixed':       '#3A0D00',
        'on-primary-fixed-variant': '#832600',

        /* Secondary – warm neutral */
        secondary:                '#635E58',
        'secondary-container':    '#E6DED7',
        'on-secondary':           '#FFFFFF',
        'on-secondary-container': '#67625C',
        'secondary-fixed':        '#E9E1DA',
        'secondary-fixed-dim':    '#CDC5BE',
        'on-secondary-fixed':     '#1E1B17',
        'on-secondary-fixed-variant': '#4A4641',

        /* Dopamine Accents – 2026 trend */
        accent:                   '#00D4AA',
        'accent-dim':             '#00B896',
        'accent-container':       '#003D30',
        'on-accent':              '#003D30',
        'accent-warm':            '#FFB547',
        'accent-warm-dim':        '#E5A03E',
        'on-accent-warm':         '#3A2800',

        /* Outline */
        outline:                  '#8B7169',
        'outline-variant':        '#DFC0B6',

        /* Error */
        error:                    '#BA1A1A',
        'error-container':        '#FFDAD6',
        'on-error':               '#FFFFFF',
        'on-error-container':     '#93000A',

        /* Inverse */
        'inverse-surface':        '#33302C',
        'inverse-on-surface':     '#F7EFEA',
        'inverse-primary':        '#FFB59D',

        /* Surface tint */
        'surface-tint':           '#A63B10',

        /* Tertiary (reserved) */
        tertiary:                 '#005685',
        'tertiary-container':     '#006FAA',
        'on-tertiary':            '#FFFFFF',
        'on-tertiary-container':  '#DCECFF',
        'tertiary-fixed':         '#CDE5FF',
        'tertiary-fixed-dim':     '#94CCFF',
        'on-tertiary-fixed':      '#001D32',
        'on-tertiary-fixed-variant': '#004B74',

        /* Success */
        success:                  '#00D4AA',
        'success-dim':            '#00B896',
        'on-success':             '#003D30',

        /* Dark surface (hero, footer, ticker) */
        'dark-surface':           '#141210',
        'dark-surface-dim':       '#0E0D0B',

        /* Admin bg */
        admin:                    '#F4F2EF',
      },

      fontFamily: {
        display:  ['var(--font-outfit)', 'Outfit', 'system-ui', 'sans-serif'],
        headline: ['var(--font-outfit)', 'Outfit', 'system-ui', 'sans-serif'],
        serif:    ['Playfair Display', 'serif'],
        body:     ['Plus Jakarta Sans', 'sans-serif'],
        label:    ['Plus Jakarta Sans', 'sans-serif'],
        logo:     ['Noto Serif', 'serif'],
      },

      borderRadius: {
        DEFAULT: '0.375rem',
        sm:      '0.25rem',
        md:      '0.5rem',
        lg:      '0.75rem',
        xl:      '1rem',
        '2xl':   '1.25rem',
        '3xl':   '1.75rem',
        '4xl':   '2.5rem',
        full:    '9999px',
      },

      boxShadow: {
        ambient:    '0 4px 32px rgba(26, 23, 20, 0.06)',
        lift:       '0 12px 40px rgba(26, 23, 20, 0.08)',
        float:      '0 2px 16px rgba(26, 23, 20, 0.05)',
        'glow-sm':  '0 0 20px rgba(166, 59, 16, 0.15)',
        glow:       '0 0 40px rgba(166, 59, 16, 0.2)',
        'glow-lg':  '0 8px 60px rgba(166, 59, 16, 0.25)',
        'glow-accent': '0 0 30px rgba(0, 212, 170, 0.2)',
        depth:      '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 16px 32px rgba(0,0,0,0.04)',
        'depth-lg': '0 2px 4px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.06)',
      },

      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },

      animation: {
        ticker:          'ticker 40s linear infinite',
        'pulse-dot':     'pulse-dot 2s ease-in-out infinite',
        'cart-bounce':   'cart-bounce 0.4s ease',
        'slide-in-right':'slide-in-right 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-up':      'slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in':       'fade-in 0.4s ease',
        shimmer:         'shimmer 2s linear infinite',
        float:           'float 6s ease-in-out infinite',
        'scale-in':      'scale-in 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'blur-in':       'blur-in 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'gradient-x':    'gradient-x 3s ease infinite',
        'breathe':       'breathe 3s ease-in-out infinite',
        'counter-roll':  'counter-roll 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      },

      keyframes: {
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':       { opacity: '0.4', transform: 'scale(1.6)' },
        },
        'cart-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '30%':       { transform: 'scale(1.3)' },
          '60%':       { transform: 'scale(0.9)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        'scale-in': {
          from: { transform: 'scale(0.9)', opacity: '0' },
          to:   { transform: 'scale(1)', opacity: '1' },
        },
        'blur-in': {
          from: { filter: 'blur(8px)', opacity: '0', transform: 'translateY(8px)' },
          to:   { filter: 'blur(0)', opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':       { opacity: '1', transform: 'scale(1.1)' },
        },
        'counter-roll': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
      },

      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring':   'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}

export default config
