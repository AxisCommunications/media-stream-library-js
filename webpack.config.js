module.exports = {
  target: 'web',
  entry: './lib/index.browser.js',
  mode: 'production',
  output: {
    library: 'mediaStreamLibrary',
    path: __dirname,
    filename: 'dist/media-stream-library.min.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            sourceType: 'unambiguous',
            presets: [['@babel/preset-env', { 'useBuiltIns': 'usage' }]],
            babelrc: false
          }
        }
      }
    ]
  }
}
