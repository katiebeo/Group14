// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure TypeScript files are supported
config.resolver.sourceExts = [...config.resolver.sourceExts, "ts", "tsx"];

// Suppress stack frames like InternalBytecode.js
config.symbolicator = {
  customizeFrame: () => ({
    collapse: true,
  }),
};

module.exports = config;