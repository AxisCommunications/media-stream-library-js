### Node CLI video example

This example converts an RTP stream to an MP4 file,
which can then be played by a suitable application.

```
node player.js --uri [rtsp-uri] | vlc -
```

When stdout is connected to a terminal, the message
type and size for all the messages coming out of the
MP4 component are logged instead. The main use is for
development and testing.

```
node player.js --uri [rtsp-uri]
```

If you use an Axis camera you can just send in the ip
address of the camera and the lib will work out the
uri for you.

```
node player.js --host [IP-address]
```

You can also specify a list of optional VAPIX options
to use as a key=value pair.

For example:

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

Example:

```
node player.js --host [IP-address] --vapix rotation=180 fps=10 resolution=800x600 | vlc -
```

`--uri` can not be used at the same time as `--host` and / or `--vapix`

For full list of options type

```
node player.js --help
```
