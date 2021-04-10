const webpack = require('webpack')

module.exports = {
  target: 'web',
  entry: './lib/index.browser.ts',
  mode: 'production',
  output: {
    library: 'mediaStreamLibrary',
    libraryTarget: 'umd',
    path: __dirname,
    filename: 'dist/media-stream-library.legacy.min.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    // These polyfills replace Node.js packages with browser alternatives
    fallback: {
      buffer: require.resolve('buffer'),
      stream: require.resolve('stream-browserify'),
      process: require.resolve('process/browser'),
    },
  },
  plugins: [
    // Import things that are not explicitely imported, because they should
    // be global, or are used by other modules and expected to exist.
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process', // Needed internally by stream-browserify
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        // We need to transpile certain node_modules packages, as they
        // don't supply any ES5 compatible code. This will become more
        // of an issue as libraries move over to delivering ES6 only.
        exclude: /node_modules\/(?!(debug)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            sourceType: 'unambiguous',
            presets: [
              [
                '@babel/env',
                {
                  useBuiltIns: 'usage',
                  corejs: 3,
                  browserslistEnv: 'legacy',
                },
              ],
              '@babel/typescript',
            ],
            plugins: [
              '@babel/proposal-class-properties',
              '@babel/proposal-object-rest-spread',
            ],
            babelrc: false,
          },
        },
      },
    ],
  },
}
