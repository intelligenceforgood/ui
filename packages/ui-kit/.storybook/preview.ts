import type { Preview } from "@storybook/react-vite";
import "../src/storybook.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    backgrounds: {
      options: {
        light: { name: "light", value: "#F8FAFC" },
        dark: { name: "dark", value: "#0F172A" },
        white: { name: "white", value: "#FFFFFF" },
      },
    },
  },

  initialGlobals: {
    backgrounds: {
      value: "light",
    },
  },
};

export default preview;
