const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add node_modules resolution for pretty-format
config.resolver.extraNodeModules = {
  'pretty-format': path.resolve(__dirname, 'node_modules/pretty-format'),
};

module.exports = config;
