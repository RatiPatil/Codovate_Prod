/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        'primary-dark': '#1D4ED8',
        'primary-light': '#3B82F6',
        'brand-indigo': '#4F46E5',
        'brand-purple': '#7C3AED',
        'accent-purple': '#9333EA',
        'brand-slate': '#0F172A',
        'brand-muted': '#475569',
        'brand-border': '#E2E8F0',
        'soft-purple': '#F5F3FF',
        // Sidebar shell design tokens
        sidebar: '#0b0a1e',
        'sidebar-hover': 'rgba(255,255,255,0.07)',
        'sidebar-border': 'rgba(255,255,255,0.07)',
        'shell-bg': '#f8fafc',
        'shell-header': '#ffffff',
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg, #0b0a1e 0%, #110e2e 100%)',
        'nav-active': 'linear-gradient(90deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
        'upgrade-card': 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
        'brand-gradient': 'linear-gradient(90deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
      },
      boxShadow: {
        'nav-active': '0 4px 20px rgba(37, 99, 235, 0.35)',
        'sidebar': '4px 0 32px rgba(0,0,0,0.4)',
        'header': '0 1px 0 rgba(0,0,0,0.06)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      animation: {
        slideUp: 'slideUp 0.3s ease-out forwards',
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        shimmer: 'shimmer 2s infinite linear',
      }
    },
  },
  plugins: [],
}