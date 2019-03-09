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
              ['@babel/env', { useBuiltIns: 'usage' }],
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
