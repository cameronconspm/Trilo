module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add any other plugins here if needed
      // Temporarily disabled to resolve Hermes engine issue
      // require.resolve('react-native-worklets/plugin'), // This must be the last plugin
    ],
  };
};
