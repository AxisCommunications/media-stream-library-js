import { Source } from '../component';
export declare class TcpSource extends Source {
    /**
     * Create a TCP component.
     * A TCP socket will be created from parsing the URL of the first outgoing message.
     */
    constructor();
}
