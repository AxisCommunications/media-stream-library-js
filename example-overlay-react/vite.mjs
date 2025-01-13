import reactPlugin from '@vitejs/plugin-react'
import { createServer } from 'vite'

createServer({
  configFile: false,
  optimizeDeps: {
    entries: ['index.html'],
  },
  resolve: {
    alias: {
      'media-stream-library/overlay': '../dist/overlay/index.js',
    },
  },
  plugins: [reactPlugin()],
})
  .then((server) => {
    return server.listen()
  })
  .then((server) => {
    server.printUrls()
  })
  .catch((err) => {
    console.error(err)
  })
