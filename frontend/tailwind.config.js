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
        primary: '#2015ff',
        'primary-dark': '#1a10d4',
        'primary-light': '#4035ff',
        // Sidebar shell design tokens
        sidebar: '#0b0a1e',
        'sidebar-hover': 'rgba(255,255,255,0.07)',
        'sidebar-border': 'rgba(255,255,255,0.07)',
        'shell-bg': '#f0f2ff',
        'shell-header': '#ffffff',
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg, #0b0a1e 0%, #110e2e 100%)',
        'nav-active': 'linear-gradient(135deg, #6c3aff 0%, #3a9bff 100%)',
        'upgrade-card': 'linear-gradient(135deg, #6c3aff 0%, #3a9bff 100%)',
        'brand-gradient': 'linear-gradient(135deg, #7c3aed 0%, #2015ff 50%, #0ea5e9 100%)',
      },
      boxShadow: {
        'nav-active': '0 4px 24px rgba(108, 58, 255, 0.4)',
        'sidebar': '4px 0 32px rgba(0,0,0,0.4)',
        'header': '0 1px 0 rgba(0,0,0,0.06)',
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