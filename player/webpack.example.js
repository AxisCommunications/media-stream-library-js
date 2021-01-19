const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')

/**
 * Build the entire example + library for hosting locally with the webpack dev
 * server.
 *
 * The dev server proxies all requests with VAPIX paths to the IP provide to the
 * camera variable on the environment. This takes care of any CORS problems you
 * would have when fetching directly from the camera IP.
 */
module.exports = (env) => {
  return {
    entry: './examples/react-app/index',
    mode: 'development',

    resolve: {
      alias: {
        'media-stream-player$': path.resolve(__dirname, 'dist/esm/index.js'),
      },
      extensions: ['.js', '.jsx'],
    },

    module: {
      rules: [
        {
          test: /\.jsx?$/,
          use: {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [
                '@babel/preset-react',
                [
                  '@babel/env',
                  {
                    targets: {
                      browsers: [
                        'last 2 chrome versions, last 2 firefox versions',
                      ],
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
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: 'examples/react-app/template.html',
      }),
    ],

    devServer: {
      host: 'localhost',
      port: 3554,
      proxy: [
        {
          context: ['/axis-cgi', '/rtsp-over-websocket'],
          target: `http://${env.camera ?? '192.168.0.90'}`,
          changeOrigin: true,
          ws: true,
          logLevel: 'debug',
        },
      ],
    },
  }
}
