import { Sink } from '../component';
/**
 * The socket used here is a ws socket returned by
 * a ws Server's 'connection' event.
 */
export declare class WSSink extends Sink {
    constructor(socket: any);
}
