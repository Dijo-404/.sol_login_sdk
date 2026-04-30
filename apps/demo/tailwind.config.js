/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
                extend: {
                    fontFamily: {
                        sans: ['Outfit', 'Satoshi', 'system-ui', 'sans-serif'],
                        display: ['Outfit', 'sans-serif'],
                        body: ['Satoshi', 'Outfit', 'sans-serif'],
                        mono: ['"Azeret Mono"', '"JetBrains Mono"', 'monospace'],
                    },
                    colors: {
                        navy: {
                            950: '#02040A',
                            900: '#0A0D16',
                            800: '#10131F',
                            700: '#1A1E2E',
                        },
                        sol: {
                            purple: '#9945FF',
                            teal: '#14F195',
                            accent: '#00C2FF',
                            pink: '#FF2D78',
                        },
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                            DEFAULT: 'hsl(var(--card))',
                            foreground: 'hsl(var(--card-foreground))',
                        },
                        popover: {
                            DEFAULT: 'hsl(var(--popover))',
                            foreground: 'hsl(var(--popover-foreground))',
                        },
                        primary: {
                            DEFAULT: 'hsl(var(--primary))',
                            foreground: 'hsl(var(--primary-foreground))',
                        },
                        secondary: {
                            DEFAULT: 'hsl(var(--secondary))',
                            foreground: 'hsl(var(--secondary-foreground))',
                        },
                        muted: {
                            DEFAULT: 'hsl(var(--muted))',
                            foreground: 'hsl(var(--muted-foreground))',
                        },
                        accent: {
                            DEFAULT: 'hsl(var(--accent))',
                            foreground: 'hsl(var(--accent-foreground))',
                        },
                        destructive: {
                            DEFAULT: 'hsl(var(--destructive))',
                            foreground: 'hsl(var(--destructive-foreground))',
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                    },
                    borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)',
                    },
                    keyframes: {
                        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
                        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
                        'glow-pulse': {
                            '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
                            '50%': { opacity: '1', transform: 'scale(1.05)' },
                        },
                        'shimmer': {
                            '0%': { backgroundPosition: '-200% 0' },
                            '100%': { backgroundPosition: '200% 0' },
                        },
                        'float': {
                            '0%, 100%': { transform: 'translateY(0px)' },
                            '50%': { transform: 'translateY(-10px)' },
                        },
                        'gradient-x': {
                            '0%, 100%': { backgroundPosition: '0% 50%' },
                            '50%': { backgroundPosition: '100% 50%' },
                        },
                    },
                    animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
                        'shimmer': 'shimmer 3s linear infinite',
                        'float': 'float 4s ease-in-out infinite',
                        'gradient-x': 'gradient-x 8s ease infinite',
                    },
                    backdropBlur: {
                        '3xl': '64px',
                    },
                },
            },
            plugins: [require("tailwindcss-animate")],
};