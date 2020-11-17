;(function () {
  var pipelines = mediaStreamLibrary.pipelines

  /**
   * This example works with an ES5 version of the media stream library.
   * The purpose of this example is to demonstrate Internet explorer (IE) functionality.
   */

  function authorize(host) {
    // var username = 'root';
    // var password = '<some_super_secret>';
    var auth = new XMLHttpRequest()
    // this will force a popup requesting a username and password
    // to bypass the popup give the username and password directly in the request (uncomment)
    auth.open(
      'GET',
      'http://' + host + '/axis-cgi/usergroup.cgi',
      false /*, username, password*/,
    )
    auth.send(null)
  }

  function play(host, encoding) {
    var videoEl = document.querySelector('video')
    var canvasEl = document.querySelector('canvas')
    // Grab a reference to the video element
    var Pipeline
    var mediaElement
    if (encoding === 'h264') {
      Pipeline = pipelines.Html5VideoPipeline
      mediaElement = videoEl
      // hide the other output
      videoEl.style.display = ''
      canvasEl.style.display = 'none'
    } else {
      Pipeline = pipelines.Html5CanvasPipeline
      mediaElement = canvasEl
      // hide the other output
      videoEl.style.display = 'none'
      canvasEl.style.display = ''
    }

    var config = {}
    config.ws = {
      uri: 'ws://' + host + '/rtsp-over-websocket',
    }
    config.rtsp = {
      uri: 'rtsp://' + host + '/axis-media/media.amp?videocodec=' + encoding,
    }
    config.mediaElement = mediaElement
    // Setup a new pipeline
    var pipeline = new Pipeline(config)

    pipeline.ready.then(function () {
      pipeline.rtsp.play()
    })

    return pipeline
  }

  var pipeline

  document.addEventListener(
    'DOMContentLoaded',
    function () {
      init()
    },
    false,
  )

  function init() {
    var playButton = document.querySelector('#play-button')
    playButton.addEventListener('click', function (e) {
      var device = document.querySelector('#device')
      var host = device.value || device.placeholder
      var encoding = document.querySelector('input[name=encoding]:checked').id

      console.log(host, encoding)
      authorize(host)
      console.log('done authorization')

      pipeline = play(host, encoding)
    })
  }
})()
