import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: '#1A73E8',
        'board-bg': '#F0F2F5',
        'board-bg-dark': '#1A1A2E',
        'card-dark': '#16213E',
      },
    },
  },
  plugins: [],
};

export default config;
