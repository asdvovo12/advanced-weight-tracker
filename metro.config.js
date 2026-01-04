// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// إضافة Aliases لإجبار التطبيق على استخدام shim.js
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'ws': require.resolve('./ws-shim.js'),
  'url': require.resolve('./shim.js'),
  'stream': require.resolve('./shim.js'),
  'http': require.resolve('./shim.js'),
  'https': require.resolve('./shim.js'),
  'net': require.resolve('./shim.js'),
  'tls': require.resolve('./shim.js'),
  'crypto': require.resolve('./shim.js'),
  'fs': require.resolve('./shim.js'),
  'events': require.resolve('./shim.js'),
  'zlib': require.resolve('./shim.js'),
};

module.exports = config;
