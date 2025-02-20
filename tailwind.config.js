/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

// module.exports = {
//   theme: {
//     extend: {
//       animation: {
//         "scroll-left": "scrollLeft 10s linear infinite",
//       },
//       keyframes: {
//         scrollLeft: {
//           "0%": { transform: "translateX(100%)" },
//           "100%": { transform: "translateX(-100%)" },
//         },
//       },
//     },
//   },
//   plugins: [],
// };
