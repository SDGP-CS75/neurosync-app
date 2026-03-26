const { defineConfig } = require('eslint/config-helpers');

module.exports = defineConfig([
  {
    ignores: [
      'node_modules',
      'dist',
      '.expo',
      '.expo-web',
      'web-build',
      'web-dist',
      'dist-web',
    ],
  },
]);
