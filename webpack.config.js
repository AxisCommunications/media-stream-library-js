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
    // The debug packages resolves to src/debug.js by default
    // which doesn't work on IE11 (it's not ES5), but it seems
    // that the dist/debug.js file does work.
    alias: {
      debug: 'debug/dist/debug.js',
    },
  },
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
