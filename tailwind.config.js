/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./api/**/*.js", "./*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#84d999",
        secondary: "#b2d1b7",
        tertiary: "#a2ced5",
        error: "#ffb4ab",
        background: "#111317",
        "on-primary": "#00391c",
        "on-secondary": "#1f3525",
        "on-tertiary": "#00363d",
        "on-error": "#690005",
        "on-background": "#e2e2e8",
        "surface-container-lowest": "#0b0e12",
        "surface-container-low": "#1a1c20",
        "surface-container": "#1e2024",
        "surface-container-high": "#282b30",
        "on-surface": "#e2e2e8",
        "on-surface-variant": "#c0c9be",
        "outline": "#8a9389",
        "outline-variant": "#3f4940"
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
