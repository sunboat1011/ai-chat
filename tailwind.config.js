/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#f0ece2',
          hover: '#d6dff0',
          active: '#B7C6E5',
        },
        chat: {
          bg: '#f8f8f0',
          input: 'rgb(247, 243, 223)',
          user: 'rgb(247, 243, 223)',
          ai: 'transparent',
          border: '#c4b89e',
        },
        accent: {
          DEFAULT: '#19c8b9',
          hover: '#3dd4c6',
          light: '#e6f9f6',
        },
      },
      fontFamily: {
        mono: ['"Fira Code"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: [
          '"Nunito"',
          '"Noto Sans SC"',
          '"Zen Maru Gothic"',
          '-apple-system',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        typing: 'typing 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
}
