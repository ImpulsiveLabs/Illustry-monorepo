// @ts-nocheck
const { transformAsync } = require('@babel/core');

module.exports = function istanbulLoader(source, inputSourceMap) {
  const callback = this.async();

  if (this.cacheable) {
    this.cacheable();
  }

  transformAsync(source, {
    babelrc: false,
    configFile: false,
    compact: false,
    filename: this.resourcePath,
    inputSourceMap,
    plugins: [
      [
        require.resolve('babel-plugin-istanbul'),
        {
          exclude: ['e2e/**', '**/*.spec.*', '**/*.test.*']
        }
      ]
    ],
    sourceMaps: true
  }).then(
    (result) => callback(null, result?.code ?? source, result?.map ?? inputSourceMap),
    (error) => callback(error)
  );
};
