## Browser HTML5 video example

### Getting started

This example plays an RTP stream from an Axis camera
through an HTML5 video element.

You have to make sure you've built the `media-stream-library.min.js` bundle
by running `yarn && yarn build` in the top directory.
Then, just serve the contents of this directory:

```
yarn http-server
```

### Create your own player

The example `index.html` shows how you can include `media-stream-library.min.js`
directly in your html file to then use to create a player.

The `player.js` file implements a minimal player, which can be a starting
point to create a more advanced player.