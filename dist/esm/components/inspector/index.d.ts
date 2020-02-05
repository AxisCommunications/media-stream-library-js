import { Tube } from '../component';
import { MessageType } from '../message';
/**
 * Component that logs whatever is passing through.
 */
export declare class Inspector extends Tube {
    /**
     * Create a new inspector component.
     * @argument {String} type  The type of message to log (default is to log all).
     * @return {undefined}
     */
    constructor(type?: MessageType);
}
