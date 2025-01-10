import { start } from './pipeline.mjs'

function help() {
  console.log(`
Stream live from camera (to be used from Node CLI).
Command line tool to open a websocket/rtsp connection to a camera.

Example usage:

node player.mjs rtsp://192.168.0.2/axis-media/media.amp?audio=1&resolution=800x600 | vlc -

Some VAPIX options:
 - videocodec=[h264,mpeg4,jpeg] (Select a specific video codec)
 - streamprofile=<name> (Use a specific stream profile)
 - recordingid=<name> (Play a specific recording)
 - resolution=<wxh> (The required resolution, e.g. 800x600)
 - audio=[0,1] (Enable=1 or disable=0 audio)
 - camera=[1,2,...,quad] (Select a video source)
 - compression=[0..100] (Vary between no=0 and full=100 compression)
 - colorlevel=[0..100] (Vary between grey=0 and color=100)
 - color=[0,1] (Enable=0 or disable=0 color)
 - clock=[0,1] (Show=1 or hide=0 the clock)
 - date=[0,1] (Show=1 or hide=0 the date)
 - text=[0,1] (Show=1 or hide=0 the text overlay)
 - textstring=<message>
 - textcolor=[black,white]
 - textbackgroundcolor=[black,white,transparent,semitransparent]
 - textpos=[0,1] (Show text at top=0 or bottom=0)
 - rotation=[0,90,180,270] (How may degrees to rotate the strea,)
 - duration=<number> (How many seconds of video you want, unlimited=0)
 - nbrofframes=<number> (How many frames of video you want, unlimited=0)
 - fps=<number> (How many frames per second, unlimited=0)
`)
}

const [uri] = process.argv.slice(2)
if (!uri) {
  console.error('You must specify either a host or full RTSP uri')
  help()
  process.exit(1)
}

// Setup a new pipeline
// const pipeline = new pipelines.CliMp4Pipeline(config)
// pipeline.rtsp.play()
start(uri).catch((err) => {
  console.error('failed:', err)
})
