/** @type {import('next').NextConfig} */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#191a1f",
          surface: "#24262d",
          border: "#3c4043",
          text: "#ffffff",
          muted: "#9aa0a6",
        },
        accent: {
          blue: "#4d90fe",
        },
      },
    },
  },
  plugins: [],
};
