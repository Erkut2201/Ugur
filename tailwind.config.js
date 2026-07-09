/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#C8A96E",
          dark:    "#1a1a1a",
          muted:   "#555555",
          gold:    "#C8A96E",
        },
      },
    },
  },
  plugins: [],
};
