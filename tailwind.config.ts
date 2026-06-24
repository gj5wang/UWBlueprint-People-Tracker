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
        // UW Blueprint brand colors
        blueprint: {
          blue: '#1F5EFF',
          'blue-dark': '#1648CC',
          'blue-light': '#E8EEFF',
          navy: '#0D1B4B',
          gray: '#6B7280',
          'gray-light': '#F3F4F6',
          'gray-border': '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
