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
        blueprint: {
          blue:        '#2563EB',
          'blue-dark': '#1d4ed8',
          'blue-vivid':'#3b82f6',
          'blue-light':'#dbeafe',
          'blue-pale': '#eff6ff',
          indigo:      '#4f46e5',
          navy:        '#0f1740',
          'navy-mid':  '#1e3a8a',
          purple:      '#7c3aed',
          gray:        '#6B7280',
          'gray-light':'#f0f4ff',
          'gray-border':'#e0e7ff',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0f1740 0%, #1e3a8a 45%, #2563EB 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #1e3a8a 0%, #2563EB 60%, #3b82f6 100%)',
        'card-glow': 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(79,70,229,0.04) 100%)',
      },
      boxShadow: {
        'blue-sm': '0 1px 3px rgba(37,99,235,0.12), 0 1px 2px rgba(37,99,235,0.08)',
        'blue-md': '0 4px 12px rgba(37,99,235,0.15), 0 2px 4px rgba(37,99,235,0.08)',
        'blue-lg': '0 8px 24px rgba(37,99,235,0.2), 0 4px 8px rgba(37,99,235,0.1)',
      },
    },
  },
  plugins: [],
}

export default config
