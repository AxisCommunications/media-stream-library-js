const yargs = require('yargs')

const { pipelines } = require('../../lib/index.node.js')

/**
 * Stream live from camera (to be used from Node CLI).
 * Command line tool to open a websocket/rtsp connection to a camera.
 *
 * Example usage: (when live is globally available)
 *   node mjpeg-player.js --host 192.168.0.90 --vapix resolution=800x600 videocodec=jpeg | mpv --demuxer-lavf-probescore=10 -
 * or the equivalend with an explicit URI:
 *   node mjpeg-player.js --uri 'rtsp://192.168.0.90/axis-media/media.amp?videocodec=jpeg&resolution=800x600' | mpv --demuxer-lavf-probescore=10 -
 *
 * Some VAPIX options:
 *  - videocodec=[h264,mpeg4,jpeg] (Select a specific video codec)
 *  - streamprofile=<name> (Use a specific stream profile)
 *  - recordingid=<name> (Play a specific recording)
 *  - resolution=<wxh> (The required resolution, e.g. 800x600)
 *  - audio=[0,1] (Enable=1 or disable=0 audio)
 *  - camera=[1,2,...,quad] (Select a video source)
 *  - compression=[0..100] (Vary between no=0 and full=100 compression)
 *  - colorlevel=[0..100] (Vary between grey=0 and color=100)
 *  - color=[0,1] (Enable=0 or disable=0 color)
 *  - clock=[0,1] (Show=1 or hide=0 the clock)
 *  - date=[0,1] (Show=1 or hide=0 the date)
 *  - text=[0,1] (Show=1 or hide=0 the text overlay)
 *  - textstring=<message>
 *  - textcolor=[black,white]
 *  - textbackgroundcolor=[black,white,transparent,semitransparent]
 *  - textpos=[0,1] (Show text at top=0 or bottom=0)
 *  - rotation=[0,90,180,270] (How may degrees to rotate the strea,)
 *  - duration=<number> (How many seconds of video you want, unlimited=0)
 *  - nbrofframes=<number> (How many frames of video you want, unlimited=0)
 *  - fps=<number> (How many frames per second, unlimited=0)
 */

const argv = yargs.options({
  uri: { type: 'string', describe: 'rtsp://hostname/path' },
  host: { type: 'string', describe: 'hostname', conflicts: 'uri' },
  vapix: {
    type: 'string',
    describe: 'key=value [key=value ...]',
    conflicts: 'uri',
    array: true,
  },
}).argv

if (!(argv.uri || argv.host)) {
  console.log('You must specify either a host or full RTSP uri')
  yargs.showHelp()
  process.exit(1)
}

// Set up main configuration object.
const config = {
  rtsp: {
    uri: argv.uri,
    hostname: argv.host,
    parameters: argv.vapix,
  },
}

// Setup a new pipeline
const pipeline = new pipelines.CliMjpegPipeline(config)
pipeline.play()
