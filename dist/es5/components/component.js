var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { PassThrough, Readable, Writable } from 'stream';
import StreamFactory from './helpers/stream-factory';
var AbstractComponent = /** @class */ (function () {
    function AbstractComponent() {
    }
    return AbstractComponent;
}());
var Source = /** @class */ (function (_super) {
    __extends(Source, _super);
    function Source(incoming, outgoing) {
        if (incoming === void 0) { incoming = new Readable({ objectMode: true }); }
        if (outgoing === void 0) { outgoing = new Writable({ objectMode: true }); }
        var _this = _super.call(this) || this;
        _this.incoming = incoming;
        _this.outgoing = outgoing;
        _this.next = null;
        _this.prev = null;
        return _this;
    }
    /**
     * Set up a component that emits incoming messages.
     * @param {Array} messages List of objects (with data property) to emit.
     * @return {Component}
     */
    Source.fromMessages = function (messages) {
        var component = new Source(StreamFactory.producer(messages), StreamFactory.consumer());
        return component;
    };
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
    Source.prototype.connect = function (next) {
        var _this = this;
        // If the next component is not there, we want to return this component
        // so that it is possible to continue to chain. If there is a next component,
        // but this component already has a next one, or the next one already has a
        // previous component, throw an error.
        if (next === null) {
            return this;
        }
        else if (this.next !== null || next.prev !== null) {
            throw new Error('connection failed: component(s) already connected');
        }
        try {
            this.incoming.pipe(next.incoming);
            next.outgoing.pipe(this.outgoing);
        }
        catch (e) {
            throw new Error("connection failed: " + e.message);
        }
        /**
         * Propagate errors back upstream, this assures an error will be propagated
         * to all previous streams (but not further than any endpoints). What happens
         * when an error is emitted on a stream is up to the stream's implementation.
         */
        var incomingErrorHandler = function (err) {
            _this.incoming.emit('error', err);
        };
        next.incoming.on('error', incomingErrorHandler);
        var outgoingErrorHandler = function (err) {
            next.outgoing.emit('error', err);
        };
        this.outgoing.on('error', outgoingErrorHandler);
        // Keep a bidirectional linked list of components by storing
        // a reference to the next component and the listeners that we set up.
        this.next = next;
        next.prev = this;
        this._incomingErrorHandler = incomingErrorHandler;
        this._outgoingErrorHandler = outgoingErrorHandler;
        return next;
    };
    /**
     * Disconnect the next connected component. When there is no next component
     * the function will just do nothing.
     * @return {Component} - A reference to this component.
     */
    Source.prototype.disconnect = function () {
        var next = this.next;
        if (next !== null) {
            this.incoming.unpipe(next.incoming);
            next.outgoing.unpipe(this.outgoing);
            if (typeof this._incomingErrorHandler !== 'undefined') {
                next.incoming.removeListener('error', this._incomingErrorHandler);
            }
            if (typeof this._outgoingErrorHandler !== 'undefined') {
                this.outgoing.removeListener('error', this._outgoingErrorHandler);
            }
            this.next = null;
            next.prev = null;
            delete this._incomingErrorHandler;
            delete this._outgoingErrorHandler;
        }
        return this;
    };
    return Source;
}(AbstractComponent));
export { Source };
var Tube = /** @class */ (function (_super) {
    __extends(Tube, _super);
    function Tube(incoming, outgoing) {
        if (incoming === void 0) { incoming = new PassThrough({ objectMode: true }); }
        if (outgoing === void 0) { outgoing = new PassThrough({ objectMode: true }); }
        var _this = _super.call(this, incoming, outgoing) || this;
        _this.incoming = incoming;
        _this.outgoing = outgoing;
        return _this;
    }
    Tube.fromHandlers = function (fnIncoming, fnOutgoing) {
        var incomingStream = fnIncoming
            ? StreamFactory.peeker(fnIncoming)
            : undefined;
        var outgoingStream = fnOutgoing
            ? StreamFactory.peeker(fnOutgoing)
            : undefined;
        return new Tube(incomingStream, outgoingStream);
    };
    return Tube;
}(Source));
export { Tube };
var Sink = /** @class */ (function (_super) {
    __extends(Sink, _super);
    function Sink(incoming, outgoing) {
        if (incoming === void 0) { incoming = new Writable({ objectMode: true }); }
        if (outgoing === void 0) { outgoing = new Readable({ objectMode: true }); }
        var _this = _super.call(this) || this;
        _this.incoming = incoming;
        _this.outgoing = outgoing;
        _this.next = null;
        _this.prev = null;
        return _this;
    }
    /**
     * Set up a component that swallows incoming data (calling fn on it).
     * To print data, you would use fn = console.log.
     * @param {Function} fn The callback to use for the incoming data.
     * @return {Component}
     */
    Sink.fromHandler = function (fn) {
        var component = new Sink(StreamFactory.consumer(fn), StreamFactory.producer(undefined));
        // A sink should propagate when stream is ending.
        component.incoming.on('finish', function () {
            component.outgoing.push(null);
        });
        return component;
    };
    Sink.prototype.connect = function () {
        throw new Error('connection failed: attempting to connect after a sink');
    };
    Sink.prototype.disconnect = function () {
        return this;
    };
    return Sink;
}(AbstractComponent));
export { Sink };
//# sourceMappingURL=component.js.map