/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ── Orbital Design System ── */
      fontFamily: {
        sans:    ["Plus Jakarta Sans", "Space Grotesk", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Space Grotesk", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
      },
      screens: {
        xs: '360px',
      },
      colors: {
        /* Backgrounds */
        void:    '#05050d',   /* page background  */
        surface: '#0d0d1a',   /* card background  */
        raised:  '#13131f',   /* elevated surface */
        border:  '#1e1e30',   /* subtle border    */

        /* Cyan accent – primary CTA */
        cyan: {
          50:  '#e6fbff',
          100: '#b3f4ff',
          200: '#66e8ff',
          300: '#19daff',
          400: '#00c8ff',  /* primary        */
          500: '#00b0e0',
          600: '#0090c0',
          700: '#006e96',
          800: '#004e6e',
          900: '#002e42',
        },

        /* Violet accent – secondary */
        violet: {
          50:  '#f3eeff',
          100: '#ddd0ff',
          200: '#bba8ff',
          300: '#9b7fff',
          400: '#8b5cf6',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b1670',
        },

        /* Gold – price display */
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },

        /* Status */
        success: '#10b981',
        warning: '#f59e0b',
        danger:  '#ef4444',

        /* Neutrals (text) */
        ink: {
          100: '#f0f0ff',  /* primary text  */
          200: '#c8c8e8',  /* secondary     */
          400: '#8888aa',  /* muted         */
          600: '#4a4a6a',  /* very muted    */
          800: '#252540',  /* barely visible*/
        },
      },

      backgroundImage: {
        'orbital':   'linear-gradient(135deg, #00c8ff 0%, #7c3aed 100%)',
        'orbital-r': 'linear-gradient(135deg, #7c3aed 0%, #00c8ff 100%)',
        'void-grad': 'radial-gradient(ellipse 120% 60% at 50% -10%, #0d0d2a 0%, #05050d 60%)',
        'card-shine':'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 60%)',
        'glow-cyan': 'radial-gradient(circle 300px at var(--gx,50%) var(--gy,50%), rgba(0,200,255,0.12), transparent)',
        'glow-violet':'radial-gradient(circle 300px at var(--gx,50%) var(--gy,50%), rgba(124,58,237,0.12), transparent)',
      },

      boxShadow: {
        'glow-sm':  '0 0 12px rgba(0,200,255,0.25)',
        'glow-md':  '0 0 30px rgba(0,200,255,0.20)',
        'glow-lg':  '0 0 60px rgba(0,200,255,0.15)',
        'card':     '0 1px 2px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
        'card-hover':'0 4px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,200,255,0.2)',
        'modal':    '0 24px 80px rgba(0,0,0,0.8)',
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      animation: {
        'slide-left':  'slideLeft 40s linear infinite',
        'slide-right': 'slideRight 40s linear infinite',
        'fade-up':     'fadeUp 0.4s ease-out',
        'fade-in':     'fadeIn 0.25s ease-out',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'shimmer':     'shimmer 1.6s infinite',
        'ticker':      'ticker 35s linear infinite',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
      },

      keyframes: {
        slideLeft: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        slideRight: {
          '0%':   { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        glowPulse: {
          '0%,100%': { opacity: '0.6' },
          '50%':     { opacity: '1' },
        },
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
