/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ボートレースカラー
        boat: {
          1: '#FFFFFF', // 1号艇（白）
          2: '#000000', // 2号艇（黒）
          3: '#E53935', // 3号艇（赤）
          4: '#1E88E5', // 4号艇（青）
          5: '#FDD835', // 5号艇（黄）
          6: '#43A047', // 6号艇（緑）
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        dark: {
          100: '#1e293b',
          200: '#0f172a',
          300: '#020617',
        }
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
