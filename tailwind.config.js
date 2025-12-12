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
                // Gym-themed color palette
                primary: {
                    50: '#fff5f0',
                    100: '#ffe8db',
                    200: '#ffd1b8',
                    300: '#ffb088',
                    400: '#ff8a56',
                    500: '#FF6B35',  // Main brand color
                    600: '#e6522b',
                    700: '#c43d1f',
                    800: '#a0311a',
                    900: '#822816',
                },
                dark: {
                    50: '#f5f5f7',
                    100: '#e5e5e9',
                    200: '#ccccd4',
                    300: '#a6a6b2',
                    400: '#808089',
                    500: '#64646d',
                    600: '#4a4a51',
                    700: '#36363c',
                    800: '#26262a',
                    900: '#1A1A2E',  // Dark background
                },
                accent: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0EA5E9',  // Accent blue
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'sans-serif'],
            },
            boxShadow: {
                'glow': '0 0 20px rgba(255, 107, 53, 0.3)',
                'glow-accent': '0 0 20px rgba(14, 165, 233, 0.3)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'bounce-slow': 'bounce 2s infinite',
            }
        },
    },
    plugins: [],
}
