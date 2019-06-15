const process = require('process')
const { execSync, spawn } = require('child_process')

const proxiedCamera = process.env.MSL_EXAMPLE_CAMERA

console.log('Building bundle...')
execSync('yarn build', { shell: true, stdio: 'inherit' })

console.log('Starting services...')
const webpackProcess = spawn('yarn webpack --mode development --watch', {
  shell: true,
})
webpackProcess.stdout.on('data', (data) => {
  console.log(`[webpack]: ${data}`);
});

const rtspProcess = spawn('yarn rtsp', { shell: true })
rtspProcess.stdout.on('data', (data) => {
  console.log(`[rtsp]: ${data}`);
});

const serverProcess = proxiedCamera !== undefined
  ? spawn(`yarn examples -P ${proxiedCamera}`, { shell: true })
  : spawn('yarn examples', { shell: true })
serverProcess.stdout.on('data', (data) => {
  console.log(`[http]: ${data}`);
});
  

// Begin reading from stdin so the process does not exit.
process.stdin.resume()

