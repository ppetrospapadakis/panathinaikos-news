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
      },
      fontSize: {
        "display":  ["3.5625rem",  { lineHeight: "4rem",    letterSpacing: "-0.015em" }],
        "h1":       ["2.25rem",    { lineHeight: "2.75rem", letterSpacing: "-0.01em"  }],
        "h2":       ["1.75rem",    { lineHeight: "2.25rem", letterSpacing: "-0.005em" }],
        "h3":       ["1.5rem",     { lineHeight: "2rem",    letterSpacing: "0"        }],
        "h4":       ["1.125rem",   { lineHeight: "1.5rem",  letterSpacing: "0"        }],
        "body-lg":  ["1.125rem",   { lineHeight: "1.75rem", letterSpacing: "0"        }],
        "body":     ["1rem",       { lineHeight: "1.5rem",  letterSpacing: "0"        }],
        "body-sm":  ["0.875rem",   { lineHeight: "1.25rem", letterSpacing: "0"        }],
        "label":    ["0.875rem",   { lineHeight: "1rem",    letterSpacing: "0.006em"  }],
        "caption":  ["0.75rem",    { lineHeight: "1rem",    letterSpacing: "0.025em"  }],
      },
      fontFamily: {
        "display": ["Geist", "sans-serif"],
        "h1":      ["Geist", "sans-serif"],
        "h2":      ["Geist", "sans-serif"],
        "h3":      ["Geist", "sans-serif"],
        "h4":      ["Geist", "sans-serif"],
        "body-lg": ["Geist", "sans-serif"],
        "body":    ["Geist", "sans-serif"],
        "body-sm": ["Geist", "sans-serif"],
        "label":   ["Geist", "sans-serif"],
        "caption": ["Geist", "sans-serif"],
      },
      fontWeight: {
        "display": "700",
        "h1":      "700",
        "h2":      "700",
        "h3":      "600",
        "h4":      "600",
        "body-lg": "400",
        "body":    "400",
        "body-sm": "400",
        "label":   "500",
        "caption": "400",
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
