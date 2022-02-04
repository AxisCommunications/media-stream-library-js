import { Duplex, PassThrough, Readable, Stream, Writable } from 'stream'
import StreamFactory from './helpers/stream-factory'
import { MessageHandler, GenericMessage } from './message'

export type Component = Source | Tube | Sink

type ErrorEventHandler = (err: Error) => void

/**
 * Component
 *
 * A component is a set of bi-directional streams consisting of an 'incoming'
 * and 'outgoing' stream.
 *
 * They contain references to other components so they can form a linked list of
 * components, i.e. a pipeline. When linking components, the incoming and
 * outgoing streams are piped, so that data flowing through the incoming stream
 * is transfered to the next component, and data in the outgoing stream flows
 * to the previous component.
 *
 * Components at the end of such a pipeline typically connect the incoming and
 * outgoing streams to a data source or data sink.
 *
 * Typically, for a component that is connected to two other components, both
 * incoming and outgoing will be Transform streams. For a source, 'incoming'
 * will be a Readable stream and 'outgoing' a Writable stream, while for a sink
 * it is reversed. Both source and sink could also use a single Duplex stream,
 * with incoming === outgoing.
 *
 * server end-point                          client end-point
 *  /-------------      -----------------      -------------\
 *  |  Writable  |  <-  |   Transform   |  <-  |  Readable  |
 *  |   source   |      |      tube     |      |    sink    |
 *  |  Readable  |  ->  |   Transform   |  ->  |  Writable  |
 *  \-------------      -----------------      -------------/
 */
abstract class AbstractComponent {
  /**
   * The stream going towards the client end-point
   */
  public abstract incoming: Stream
  /**
   * The stream going back to the server end-point
   */
  public abstract outgoing: Stream
  /**
   * The next component (downstream, towards the client)
   */
  public abstract next: Tube | Sink | null
  /**
   * The previous component (upstream, towards the server)
   */
  public abstract prev: Tube | Source | null
  protected _incomingErrorHandler?: ErrorEventHandler
  protected _outgoingErrorHandler?: ErrorEventHandler
  /**
   * Connect a downstream component (towards the client)
   */
  public abstract connect(next: Tube | Sink | null): Component
  /**
   * Disconnect a downstream component downstream (towards the client)
   */
  public abstract disconnect(): Component
}

/**
 * Source component
 *
 * A component that can only have a next component connected (no previous) and
 * where the incoming and outgoing streams are connected to an external data
 * source.
 */
export class Source extends AbstractComponent {
  /**
   * Set up a source component that has a message list as data source.
   *
   * @param messages - List of objects (with data property) to emit on the
   * incoming stream
   */
  public static fromMessages(messages: GenericMessage[]) {
    const component = new Source(
      StreamFactory.producer(messages),
      StreamFactory.consumer(),
    )

    return component
  }

  public incoming: Readable
  public outgoing: Writable
  public next: Tube | Sink | null
  public prev: null

  constructor(
    incoming: Readable = new Readable({ objectMode: true }),
    outgoing: Writable = new Writable({ objectMode: true }),
  ) {
    super()
    this.incoming = incoming
    this.outgoing = outgoing
    this.next = null
    this.prev = null
  }

  /**
   * Attach another component so the the 'down' stream flows into the
   * next component 'down' stream and the 'up' stream of the other component
   * flows into the 'up' stream of this component. This is what establishes the
   * meaning of 'up' and 'down'.
   * @param  next - The component to connect.
   * @return A reference to the connected component.
   *
   *      -------------- pipe --------------
   *  <-  |  outgoing  |  <-  |  outgoing  | <-
   *      |    this    |      |    next    |
   *  ->  |  incoming  |  ->  |  incoming  | ->
   *      -------------- pipe --------------
   */
  public connect(next: Tube | Sink | null): Component {
    // If the next component is not there, we want to return this component
    // so that it is possible to continue to chain. If there is a next component,
    // but this component already has a next one, or the next one already has a
    // previous component, throw an error.
    if (next === null) {
      return this
    } else if (this.next !== null || next.prev !== null) {
      throw new Error('connection failed: component(s) already connected')
    }

    if (!this.incoming.readable || !this.outgoing.writable) {
      throw new Error('connection failed: this component not compatible')
    }

    if (!next.incoming.writable || !next.outgoing.readable) {
      throw new Error('connection failed: next component not compatible')
    }

    try {
      this.incoming.pipe(next.incoming)
      next.outgoing.pipe(this.outgoing)
    } catch (e) {
      throw new Error(`connection failed: ${(e as Error).message}`)
    }

    /**
     * Propagate errors back upstream, this assures an error will be propagated
     * to all previous streams (but not further than any endpoints). What happens
     * when an error is emitted on a stream is up to the stream's implementation.
     */
    const incomingErrorHandler: ErrorEventHandler = (err) => {
      this.incoming.emit('error', err)
    }
    next.incoming.on('error', incomingErrorHandler)

    const outgoingErrorHandler: ErrorEventHandler = (err) => {
      next.outgoing.emit('error', err)
    }
    this.outgoing.on('error', outgoingErrorHandler)

    // Keep a bidirectional linked list of components by storing
    // a reference to the next component and the listeners that we set up.
    this.next = next
    next.prev = this
    this._incomingErrorHandler = incomingErrorHandler
    this._outgoingErrorHandler = outgoingErrorHandler

    return next
  }

  /**
   * Disconnect the next connected component. When there is no next component
   * the function will just do nothing.
   * @return {Component} - A reference to this component.
   */
  public disconnect(): Component {
    const next = this.next

    if (next !== null) {
      this.incoming.unpipe(next.incoming)
      next.outgoing.unpipe(this.outgoing)

      if (typeof this._incomingErrorHandler !== 'undefined') {
        next.incoming.removeListener('error', this._incomingErrorHandler)
      }
      if (typeof this._outgoingErrorHandler !== 'undefined') {
        this.outgoing.removeListener('error', this._outgoingErrorHandler)
      }

      this.next = null
      next.prev = null
      delete this._incomingErrorHandler
      delete this._outgoingErrorHandler
    }

    return this
  }
}

/**
 * Tube component
 *
 * A component where both incoming and outgoing streams are Duplex streams, and
 * can be connected to a previous and next component, typically in the middle of
 * a pipeline.
 */
export class Tube extends Source {
  /**
   * Create a component that calls a handler function for each message passing
   * through, but otherwise just passes data through.
   *
   * Can be used to log messages passing through a pipeline.
   */
  public static fromHandlers(
    fnIncoming: MessageHandler | undefined,
    fnOutgoing: MessageHandler | undefined,
  ) {
    const incomingStream = fnIncoming
      ? StreamFactory.peeker(fnIncoming)
      : undefined
    const outgoingStream = fnOutgoing
      ? StreamFactory.peeker(fnOutgoing)
      : undefined

    return new Tube(incomingStream, outgoingStream)
  }

  public incoming: Duplex
  public outgoing: Duplex

  constructor(
    incoming: Duplex = new PassThrough({ objectMode: true }),
    outgoing: Duplex = new PassThrough({ objectMode: true }),
  ) {
    super(incoming, outgoing)
    this.incoming = incoming
    this.outgoing = outgoing
  }
}

/**
 * Sink component
 *
 * A component that can only have a previous component connected (no next) and
 * where the incoming and outgoing streams are connected to an external data
 * source.
 */
export class Sink extends AbstractComponent {
  /**
   * Create a component that swallows incoming data (calling fn on it).  To
   * print data, you would use fn = console.log.
   *
   * @param fn - The callback to use for the incoming data.
   */
  public static fromHandler(fn: MessageHandler) {
    const component = new Sink(
      StreamFactory.consumer(fn),
      StreamFactory.producer(undefined),
    )
    // A sink should propagate when stream is ending.
    component.incoming.on('finish', () => {
      component.outgoing.push(null)
    })

    return component
  }

  public incoming: Writable
  public outgoing: Readable
  public next: null
  public prev: Tube | Source | null

  constructor(
    incoming: Writable = new Writable({ objectMode: true }),
    outgoing: Readable = new Readable({ objectMode: true }),
  ) {
    super()
    this.incoming = incoming
    this.outgoing = outgoing
    this.next = null
    this.prev = null
  }

  public connect(): Component {
    throw new Error('connection failed: attempting to connect after a sink')
  }

  public disconnect(): Component {
    return this
  }
}
