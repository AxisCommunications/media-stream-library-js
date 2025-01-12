## Streams

Provides a way to play RTP streams (H.264/AAC or JPEG) in a browser by converting
them to ISO-BMFF and feeding the stream to a SourceBuffer using the [Media Source
Extensions](https://www.w3.org/TR/media-source/) standard. The RTSP server should
provide two-way communication over WebSocket.
Additionally, streaming MP4 over HTTP to a SourceBuffer is also provided as
a way to lower latency compared to using a URL on a video tag directly.

This library is not a full media player: the framework provides no video
controls, progress bar, or other features typically associated with a media
player. For a simple React-based player we refer to the [player](/player/README.md).

However, getting video to play in the browser is quite easy (check the browser
example). There are currently no codecs included either, we rely on browser
support for that.

### Importing

**script tag** You can directly include the `msl-streams.min.js` file (available
as GitHub release asset) in your browser (check the browser example) as
an ES module. For this to work, your own script needs to be a module (use
`type="module" in the script tag`). Make sure the `src` in your script tag
matches the path of the file on the server, e.g. if it's at the top level:

```htmls
<script type="module" scr="/index.js"></script>
```

and in `index.js` you would use:

```js
import {...} from '/msl-streams.min.js';
```

**bundler** Alternatively, you use import statements in your JS/TS code using
the package name if you are going to bundle it yourself:

```js
import {...} from 'media-stream-library';
```

### Components and pipelines

The library contains a collection of components that can be connected together
to form media pipelines. The components are a low-level abstraction on top of
the Web Streams API to allow two-way communication, while media pipelines are
sets of components where the streams are connected. The provided pipelines are
a minimal set that provide WebSocket+RTSP => H.264/AAC or JPEG, and HTTP+MP4,
with some extra functionality such as authentication, retry, capture. For more
advanced usage, you can construct your own pipelines using the provided ones as
a template.

Check the `examples` section to see how these can be used in your own code. To
run the examples yourself, you'll need to clone this repository loccally and
follow the developer instructions.
