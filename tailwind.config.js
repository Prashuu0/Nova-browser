/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nova: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffd',
          300: '#7cc5fc',
          400: '#36a8f8',
          500: '#0c8ce9',
          600: '#006fc7',
          700: '#0159a1',
          800: '#064b85',
          900: '#0b3f6e',
          950: '#072849'
        },
        surface: {
          light: '#ffffff',
          dark: '#1a1a2e',
          darker: '#0f0f1a'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        }
      }
    }
  },
  plugins: []
};
