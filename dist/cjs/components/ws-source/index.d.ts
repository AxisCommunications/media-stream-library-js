import { Source } from '../component';
import { WSConfig } from './openwebsocket';
export declare class WSSource extends Source {
    onServerClose?: () => void;
    /**
     * Create a WebSocket component.
     *
     * The constructor sets up two streams and connects them to the socket as
     * soon as the socket is available (and open).
     *
     * @param {Object} socket - an open WebSocket.
     */
    constructor(socket: WebSocket);
    /**
     * Expose websocket opener as a class method that returns a promise which
     * resolves with a new WebSocketComponent.
     */
    static open(config?: WSConfig): Promise<WSSource>;
}
