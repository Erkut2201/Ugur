/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#E55300",
          dark: "#1a1a1a",
          gold: "#C8A96E",
          muted: "#555555",
        },
      },
    },
  },
  plugins: [],
};
