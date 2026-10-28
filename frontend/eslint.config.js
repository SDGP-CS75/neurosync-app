const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "node_modules",
      "coverage",
      "dist",
      ".expo",
      ".expo-web",
      "web-build",
      "web-dist",
      "dist-web",
    ],
  },
  {
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      "no-console": "off",
    },
  },
]);
