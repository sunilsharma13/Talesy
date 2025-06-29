/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Add any other directories where you write your Tailwind CSS classes
  ],
  darkMode: "class", // Use `class="dark"` strategy
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        geistSans: ['var(--font-geist-sans)', 'sans-serif'],
        geistMono: ['var(--font-geist-mono)', 'monospace'],
      },
      animation: {
        // Existing animations:
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "pulse-fast": "pulse 6s linear infinite",
        "float": "float 10s ease-in-out infinite",
        "bounce-slow": "bounceSlow 3s ease-in-out infinite",

        // New animations added for LoginPage.tsx effects:
        "fade-in-up": "fadeIn 1s ease-out forwards",
        "text-pop": "textPop 0.8s ease-out forwards",
        "bounce-once": "bounceOnce 1.5s ease-out 0.8s 1 forwards",
      },
      keyframes: {
        // Your existing keyframes:
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
          "100%": { transform: "translateY(0px)" },
        },
        bounceSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },

        // New keyframes for LoginPage.tsx effects:
        textPop: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        bounceOnce: {
          "0%, 100%": { transform: "translateY(0)" },
          "20%": { transform: "translateY(-10px)" },
          "40%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    // require('@tailwindcss/line-clamp'),
  ],
};