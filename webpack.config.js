const webpack = require('webpack');

module.exports = {
  target: 'web',
  entry: './lib/index.browser.ts',
  mode: 'production',
  output: {
    library: 'mediaStreamLibrary',
    path: __dirname,
    filename: 'dist/media-stream-library.min.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    // These polyfills replace Node.js packages with browser alternatives
    fallback: {
      buffer: require.resolve('buffer'),
      stream: require.resolve('stream-browserify'),
      process:  require.resolve('process/browser')
    },
  },
  plugins: [
    // Import things that are not explicitely imported, because they should
    // be global, or are used by other modules and expected to exist.
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process', // Needed internally by stream-browserify
    })
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            sourceType: 'unambiguous',
            presets: [
              ['@babel/env', { useBuiltIns: 'usage', corejs: 3 }],
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
