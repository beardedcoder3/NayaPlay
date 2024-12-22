/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Your existing colors remain the same
        surface: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#242938',  // Main UI elements
          700: '#1e2330',  // Dropdowns, cards
          800: '#171b26',  // Main background
          900: '#101319',  // Darker sections
        },
        accent: {
          50: '#e3f2ff',
          100: '#c6e2ff',
          200: '#93cdff',
          300: '#60b8ff',
          400: '#3aa3ff',
          500: '#0088ff',  // Primary actions
          600: '#006ee6',  // Hover states
          700: '#0055b3',
          800: '#003d80',
          900: '#002c5c',
        }
      },
      animation: {
        'smoke': 'smoke 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'bounce': 'bounce 1s infinite',
        'float': 'float 3s ease-in-out infinite',
        'crash': 'crash 0.5s ease-in forwards',
        'take-off': 'takeOff 0.3s ease-out forwards',
        'flame': 'flame 0.5s ease-in-out infinite',
        'scroll-glow': 'scrollGlow 1.5s ease-in-out infinite',
      },
      keyframes: {
        smoke: {
          '0%': { 
            transform: 'translateX(0) translateY(0) scale(1)', 
            opacity: '0.3' 
          },
          '100%': { 
            transform: 'translateX(-20px) translateY(-20px) scale(2)', 
            opacity: '0' 
          },
        },
        float: {
          '0%, 100%': { 
            transform: 'translateY(0)' 
          },
          '50%': { 
            transform: 'translateY(-10px)' 
          },
        },
        crash: {
          '0%': { 
            transform: 'rotate(0deg) translateY(0)' 
          },
          '100%': { 
            transform: 'rotate(90deg) translateY(50px)',
            opacity: '0.5'
          },
        },
        takeOff: {
          '0%': { 
            transform: 'translateY(0) rotate(0deg)' 
          },
          '100%': { 
            transform: 'translateY(-20px) rotate(15deg)' 
          },
        },
        flame: {
          '0%, 100%': {
            transform: 'scaleX(1)',
            opacity: '0.8'
          },
          '50%': {
            transform: 'scaleX(1.2)',
            opacity: '1'
          },
        },
        bounce: {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
          },
        },
        scrollGlow: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.5',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'width': 'width',
        'colors': 'color, background-color, border-color',
        'opacity': 'opacity',
        'shadow': 'box-shadow',
        'transform': 'transform',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      scale: {
        '102': '1.02',
        '98': '0.98',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    function({ addBase, theme }) {
      addBase({
        'html': {
          'scroll-behavior': 'smooth',
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
        'h1, h2, h3, h4, h5, h6': {
          'font-family': 'Poppins, Inter, system-ui, -apple-system, sans-serif',
        },
        '*::-webkit-scrollbar': {
          width: '14px',
          height: '14px',
        },
        '*::-webkit-scrollbar-track': {
          background: theme('colors.surface.800'),
          borderRadius: '8px',
        },
        '*::-webkit-scrollbar-thumb': {
          background: theme('colors.surface.600'),
          borderRadius: '8px',
          border: '3px solid',
          borderColor: theme('colors.surface.800'),
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: theme('colors.surface.500'),
        },
        '*::-webkit-scrollbar-corner': {
          background: 'transparent',
        },
        '*': {
          'scrollbar-width': 'thin',
          'scrollbar-color': `${theme('colors.surface.600')} ${theme('colors.surface.800')}`,
        },
      });
    },
  ],
}