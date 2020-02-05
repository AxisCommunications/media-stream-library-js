/// <reference types="node" />
import { Duplex, Readable, Stream, Writable } from 'stream';
import { MessageHandler, GenericMessage } from './message';
export declare type Component = Source | Tube | Sink;
declare type ErrorEventHandler = (err: Error) => void;
declare abstract class AbstractComponent {
    abstract incoming: Stream;
    abstract outgoing: Stream;
    abstract next: Tube | Sink | null;
    abstract prev: Tube | Source | null;
    protected _incomingErrorHandler?: ErrorEventHandler;
    protected _outgoingErrorHandler?: ErrorEventHandler;
    abstract connect(next: Tube | Sink | null): Component;
    abstract disconnect(): Component;
}
export declare class Source extends AbstractComponent {
    /**
     * Set up a component that emits incoming messages.
     * @param {Array} messages List of objects (with data property) to emit.
     * @return {Component}
     */
    static fromMessages(messages: GenericMessage[]): Source;
    incoming: Readable;
    outgoing: Writable;
    next: Tube | Sink | null;
    prev: null;
    constructor(incoming?: Readable, outgoing?: Writable);
    /**
     * Attach another component so the the 'down' stream flows into the
     * next component 'down' stream and the 'up' stream of the other component
     * flows into the 'up' stream of this component. This is what establishes the
     * meaning of 'up' and 'down'.
     * @param {Component} next - The component to connect.
     * @return {Component} - A reference to the connected component.
     *
     *      -------------- pipe --------------
     *  <-  |  outgoing  |  <-  |  outgoing  | <-
     *      |    this    |      |    next    |
     *  ->  |  incoming  |  ->  |  incoming  | ->
     *      -------------- pipe --------------
     */
    connect(next: Tube | Sink | null): Component;
    /**
     * Disconnect the next connected component. When there is no next component
     * the function will just do nothing.
     * @return {Component} - A reference to this component.
     */
    disconnect(): Component;
}
export declare class Tube extends Source {
    static fromHandlers(fnIncoming: MessageHandler, fnOutgoing: MessageHandler): Tube;
    incoming: Duplex;
    outgoing: Duplex;
    constructor(incoming?: Duplex, outgoing?: Duplex);
}
export declare class Sink extends AbstractComponent {
    /**
     * Set up a component that swallows incoming data (calling fn on it).
     * To print data, you would use fn = console.log.
     * @param {Function} fn The callback to use for the incoming data.
     * @return {Component}
     */
    static fromHandler(fn: MessageHandler): Sink;
    incoming: Writable;
    outgoing: Readable;
    next: null;
    prev: Tube | Source | null;
    constructor(incoming?: Writable, outgoing?: Readable);
    connect(): Component;
    disconnect(): Component;
}
export {};
