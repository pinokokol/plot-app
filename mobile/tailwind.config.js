/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        White: "#FFFFFF",
        Background: '#F7F7F7',
        Orange: "#EC6E00",
        Blue: "#2699ED",
        LightBlue: "#D9F0FF",
        Green: "#105B3A",
        Yellow: "#FFC000",
        LightGray: "#E6E6E6",
        DarkGray: "#CCCCCC",
      },
    },
  },
  plugins: [],
};
