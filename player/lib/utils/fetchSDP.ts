import {
  WsSdpPipeline,
  VideoMedia,
  TransformationMatrix,
} from 'media-stream-library'

export const fetchSDP = (wsURI?: string, rtspURI?: string) => {
  const pipeline = new WsSdpPipeline({
    ws: { uri: wsURI },
    rtsp: { uri: rtspURI },
  })

  return pipeline.sdp.finally(() => {
    pipeline.close()
  })
}

export const fetchTransformationMatrix = (
  basis: 'sensor' | 'metadata',
  wsURI?: string,
  rtspURI?: string,
): Promise<TransformationMatrix | undefined> => {
  return fetchSDP(wsURI, rtspURI).then((sdp) => {
    const videoMedia = sdp.media.find((media): media is VideoMedia => {
      return media.type === 'video'
    })

    if (videoMedia === undefined) {
      return Promise.reject('Media seems to have no video track')
    }

    const transform: TransformationMatrix | undefined = videoMedia.transform
    const sensorTransform: TransformationMatrix | undefined =
      videoMedia['x-sensor-transform']

    if (basis === 'sensor') {
      return sensorTransform ?? transform
    }
    return transform
  })
}
