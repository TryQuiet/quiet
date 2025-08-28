const envFile = process.env.ENVFILE || '.env.production'
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: envFile,
        safe: false,
        allowUndefined: true,
      },
    ],
  ],
}
