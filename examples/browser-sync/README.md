## Browser HTML5 video example

### Getting started

This example plays an RTP stream from an Axis camera
through an HTML5 video element. In addition to that,
an overlay with a live view of the frame's byte size
is rendered in sync with the video, using the built-in
scheduler.

You have to make sure you've built the `media-stream-library.min.js` bundle
by running `yarn && yarn build` in the top directory.
Then, just serve the contents of this directory:

```
yarn http-server
```

The example uses the D3.js library to render the overlay,
for which you need internet access (the D3.js script is
included using an external URL)
