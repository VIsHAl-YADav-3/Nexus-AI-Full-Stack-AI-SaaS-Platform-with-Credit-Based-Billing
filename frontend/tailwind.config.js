/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          950: '#09090b',
          900: '#0f0f12',
          800: '#18181b',
          700: '#27272a',
          600: '#3f3f46',
        },
        accent: {
          indigo: '#4f46e5',
          violet: '#7c3aed',
          emerald: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glow-gradient': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'glow-radial': 'radial-gradient(circle at top, rgba(124,58,237,0.25), transparent 60%)',
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(124, 58, 237, 0.45)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        blink: 'blink 1s step-start infinite',
        fadeUp: 'fadeUp 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
