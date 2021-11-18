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
    target: 'browserslist:modern',
    entry: './examples/react-app/index.jsx',
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
                ['@babel/env', { browserslistEnv: 'modern' }],
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
      host: '0.0.0.0',
      port: 3554,
      allowedHosts: 'all',
      proxy: [
        {
          context: ['/axis-cgi', '/rtsp-over-websocket'],
          target: `http://${env.camera ?? '192.168.0.90'}`,
          changeOrigin: true,
          ws: true,
          logLevel: 'debug',
          onProxyReqWs: (...[, , socket]) => {
            socket.on('error', () => console.log('error'))
          },
          onProxyRes: (proxyRes, req, res) => {
            proxyRes.addListener('error', (e) => {
              console.log(e)
              res.socket?.end()
            })
          },
        },
      ],
    },
  }
}
