// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // ❌ Remove this line if it exists:
    // plugins: ["expo-router/babel"]
  };
};