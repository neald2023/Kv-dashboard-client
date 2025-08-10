
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kv: {
          black: '#0a0a0a',
          green: '#00ff88',
          silver: '#c0c0c0'
        }
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 255, 136, 0.45)'
      }
    }
  },
  plugins: []
}
