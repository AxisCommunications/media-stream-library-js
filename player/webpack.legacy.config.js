/**
 * Build the entire library as a single bundle to use with e.g.:
 * <script src="media-stream-player.legacy.min.js" />
 */
module.exports = {
  target: 'web',
  entry: './lib/index',
  mode: 'production',
  output: {
    library: 'mediaStreamPlayer',
    libraryTarget: 'umd',
    path: __dirname,
    filename: 'dist/media-stream-player.legacy.min.js',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      'media-stream-library$':
        'media-stream-library/dist/media-stream-library.legacy.min.js',
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            sourceType: 'unambiguous',
            presets: [
              '@babel/typescript',
              '@babel/preset-react',
              [
                '@babel/env',
                {
                  useBuiltIns: 'usage',
                  corejs: { version: '3.8', proposals: true },
                  browserslistEnv: 'legacy',
                },
              ],
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-object-rest-spread',
            ],
          },
        },
      },
    ],
  },
}
