module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            'ws': './ws-shim.js',
            
            // باقي المكتبات
            'stream': './shim.js',
            'http': './shim.js',
            'https': './shim.js',
            'net': './shim.js',
            'tls': './shim.js',
            'crypto': './shim.js',
            'fs': './shim.js',
            'events': './shim.js',
            
            // ✅ ضيف دول كمان عشان نخلص من المشكلة دي نهائي
            'url': './shim.js',
            'zlib': './shim.js',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
