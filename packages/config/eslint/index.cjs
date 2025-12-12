module.exports = {
  extends: ["next", "next/core-web-vitals"],
  parserOptions: {
    project: ["./tsconfig.json"],
  },
  rules: {
    "react/prop-types": "off",
    "@next/next/no-img-element": "off",
  },
};
