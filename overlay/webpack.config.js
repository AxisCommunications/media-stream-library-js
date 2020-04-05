const path = require('path')

/**
 * Build a library bundle without react/styled-components dependencies.
 */
module.exports = {
  entry: './lib/index.ts',
  mode: 'production',
  output: {
    library: 'media-overlay-library',
    path: path.join(__dirname, 'dist'),
    filename: 'media-overlay-library.min.js',
    libraryTarget: 'umd',
  },
  externals: {
    'styled-components': {
      commonjs: 'styled-components',
      commonjs2: 'styled-components',
      amd: 'styled-components',
    },
    react: {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react',
    },
    pepjs: {
      commonjs: 'pepjs',
      commonjs2: 'pepjs',
      amd: 'pepjs',
    },
  },
  resolve: {
    extensions: ['.tsx', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.(ts)x?$/,
        use: {
          loader: 'babel-loader',
          options: {
            sourceType: 'unambiguous',
            presets: [
              '@babel/typescript',
              '@babel/preset-react',
              [
                '@babel/env',
                {
                  debug: false,
                },
              ],
            ],
            plugins: [
              '@babel/proposal-class-properties',
              '@babel/proposal-object-rest-spread',
            ],
            babelrc: false,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
}
