module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Worklets plugin powers react-native-reanimated v4 and
    // react-native-keyboard-controller. Must be listed last.
    plugins: ["react-native-worklets/plugin"],
  };
};
