import { RtspMp4Pipeline, Scheduler, XmlMessage } from '../streams'

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
  readonly xmlDocument: XMLDocument
}
export interface ScheduledMessage {
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
  pipeline: RtspMp4Pipeline,
  { parser, cb }: MetadataHandler
): Scheduler<ScheduledMessage> => {
  /**
   * When a metadata handler is available on this component, it will be
   * called in sync with the player, using a scheduler to synchronize the
   * callback with the video presentation time.
   */
  const scheduler = new Scheduler(pipeline, cb, 30)
  const xmlParser = new DOMParser()

  const xmlMessageHandler = (msg: XmlMessage) => {
    const xmlDocument = xmlParser.parseFromString(
      msg.data.toString(),
      'text/xml'
    )
    const newMsg = parser({ ...msg, xmlDocument })
    if (msg.ntpTimestamp !== undefined) {
      scheduler.run(newMsg)
    }
  }

  // Peek at the messages coming out of RTP depay
  pipeline.rtp.peek(['xml'], (msg) => {
    if (msg.type === 'xml') {
      xmlMessageHandler(msg)
    }
  })

  // Initialize the scheduler when presentation time is ready
  pipeline.videoStartTime.then((ntpPresentationTime) => {
    scheduler.init(ntpPresentationTime)
  })

  return scheduler
}
