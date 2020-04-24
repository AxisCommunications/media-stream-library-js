import {
  MessageType,
  XmlMessage,
} from 'media-stream-library/dist/esm/components/message'

import {
  pipelines,
  utils,
  components,
} from 'media-stream-library/dist/esm/index.browser'

/**
 * Metadata handlers
 *
 * For video streams that also include ONVIF metadata,
 * once can specify a parser + synced callback to be run
 * whenever metadata occurs on the stream.
 *
 * The `parser` provided produces a scheduled message, that
 * will be returned later through the `cb` synched callback,
 * whenever the message is synchronized with the presentation.
 */
export interface MetadataXMLMessage extends XmlMessage {
  xmlDocument: XMLDocument
}
interface ScheduledMessage {
  readonly ntpTimestamp: number | undefined
  readonly data: unknown
}
export type MetadataParser = (msg: MetadataXMLMessage) => ScheduledMessage
export type MetadataCallback = (msg: ScheduledMessage) => void
export interface MetadataHandler {
  /**
   * A parser that will receive an XML message and should return
   * a new message with at least an ntpTimestamp.
   */
  readonly parser: MetadataParser
  /**
   * A synchronized callback that will be called whenever the message
   * produced by the parser is in sync with the video.
   */
  readonly cb: MetadataCallback
}

/**
 * Attach ONVIF metadata handlers to a pipeline
 *
 * @param pipeline The (HTML5 video) pipeline to modify
 * @param handlers The handlers to deal with XML data
 */
export const attachMetadataHandler = (
  pipeline: pipelines.Html5VideoPipeline,
  { parser, cb }: MetadataHandler,
) => {
  /**
   * When a metadata handler is available on this component, it will be
   * called in sync with the player, using a scheduler to synchronize the
   * callback with the video presentation time.
   */
  const scheduler = new utils.Scheduler(pipeline, cb, 30)
  const xmlParser = new DOMParser()

  const xmlMessageHandler = (msg: XmlMessage) => {
    const xmlDocument = xmlParser.parseFromString(
      msg.data.toString(),
      'text/xml',
    )
    const newMsg = parser({ ...msg, xmlDocument })
    if (msg.ntpTimestamp) {
      scheduler.run(newMsg)
    }
  }

  // Add extra components to the pipeline.
  const onvifDepay = new components.ONVIFDepay()
  const onvifHandlerPipe = components.Tube.fromHandlers((msg) => {
    if (msg.type === MessageType.XML) {
      xmlMessageHandler(msg)
    }
  }, undefined)
  pipeline.insertAfter(pipeline.rtsp, onvifDepay)
  pipeline.insertAfter(onvifDepay, onvifHandlerPipe)

  // Initialize the scheduler when presentation time is ready
  pipeline.onSync = (ntpPresentationTime: number) =>
    scheduler.init(ntpPresentationTime)
}
