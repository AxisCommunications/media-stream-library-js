/**
 * Build the entire library as a single bundle to use with e.g.:
 * <script src="media-stream-player.min.js" />
 */
module.exports = {
  entry: './lib/index',
  mode: 'production',
  output: {
    library: 'mediaStreamPlayer',
    path: __dirname,
    filename: 'dist/media-stream-player.min.js',
  },
  resolve: {
    modules: ['node_modules', 'lib', 'example'],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
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
                  debug: false,
                  useBuiltIns: 'usage',
                  corejs: {
                    version: 3,
                    proposals: true,
                  },
                },
              ],
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-object-rest-spread',
            ],
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: 'file-loader',
      },
    ],
  },
}
