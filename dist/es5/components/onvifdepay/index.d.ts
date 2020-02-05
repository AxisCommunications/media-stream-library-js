import { Tube } from '../component';
import { XmlMessage } from '../message';
export declare class ONVIFDepay extends Tube {
    constructor(handler?: (msg: XmlMessage) => void);
}
