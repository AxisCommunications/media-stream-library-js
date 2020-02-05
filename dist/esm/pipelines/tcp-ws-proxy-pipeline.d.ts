import { Pipeline } from './pipeline';
import { Server } from 'ws';
export declare class TcpWsProxyPipeline extends Pipeline {
    wss: Server;
    constructor(config?: {});
}
