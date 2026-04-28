/* eslint-disable @typescript-eslint/no-var-requires */
const { resolve } = require('path');
const webpack = require('webpack');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TerserPlugin = require('terser-webpack-plugin');
const { version, dependencies } = require('./package.json');

require('shebang-loader');
require('ts-loader');

module.exports = {
  mode: 'production',
  name: 'illustry',
  entry: {
    illustry: resolve(__dirname, 'src', 'app-cli.ts'),
    'illustry.min': resolve(__dirname, 'src', 'app-cli.ts')
  },
  output: {
    path: resolve(__dirname, 'build-dist'),
    filename: '[name].js'
  },
  externals: {
    sharp: 'commonjs sharp',
    'xlsx-stream-reader': 'commonjs xlsx-stream-reader',
    argon2: 'commonjs argon2',
    'argon2/argon2.cjs': 'commonjs argon2',
    'node-gyp-build': 'commonjs node-gyp-build',
    'node-gyp-build/index.js': 'commonjs node-gyp-build',
    '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
    '@aws-sdk/credential-providers': 'commonjs @aws-sdk/credential-providers',
    kerberos: 'commonjs kerberos',
    '@mongodb-js/zstd': 'commonjs @mongodb-js/zstd',
    'gcp-metadata': 'commonjs gcp-metadata',
    snappy: 'commonjs snappy',
    aws4: 'commonjs aws4',
    'mongodb-client-encryption': 'commonjs mongodb-client-encryption'
  },
  devtool: 'source-map',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.js$/i,
        use: { loader: 'shebang-loader' }
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }),
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(version),
      DEPENDENCIES: JSON.stringify(dependencies)
    })
  ],
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  ignoreWarnings: [
    {
      module: /node_modules\/express\/lib\/view\.js$/,
      message: /Critical dependency: the request of a dependency is an expression/
    }
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        include: /\.min\.js(\?.*)?$/i,
        extractComments: {
          condition: false,
          banner: false
        },
        terserOptions: {
          ecma: undefined,
          warnings: true,
          parse: {},
          compress: true,
          mangle: true,
          module: false,
          output: {
            comments: false
          },
          toplevel: false,
          nameCache: null,
          keep_classnames: undefined,
          keep_fnames: false
        }
      })
    ]
  }
};
