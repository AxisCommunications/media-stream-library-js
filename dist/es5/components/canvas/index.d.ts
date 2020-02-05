import { Sink } from '../component';
/**
 * Canvas component
 *
 * Draws an incoming stream of JPEG images onto a <canvas> element.
 * The RTP timestamps are used to schedule the drawing of the images.
 * An instance can be used as a 'clock' itself, e.g. with a scheduler.
 *
 * The following handlers can be set on a component instance:
 *  - onCanplay: will be called when the first frame is ready and
 *               the correct frame size has been set on the canvas.
 *               At this point, the clock can be started by calling
 *               `.play()` method on the component.
 *  - onSync: will be called when the presentation time offset is
 *            known, with the latter as argument (in UNIX milliseconds)
 *
 * @class CanvasComponent
 * @extends {Component}
 */
export declare class CanvasSink extends Sink {
    onCanplay?: () => void;
    onSync?: (ntpPresentationTime: number) => void;
    private _clock;
    private _scheduler;
    private _info;
    /**
     * Creates an instance of CanvasComponent.
     * @param { HTMLCanvasElement } el - An HTML < canvas > element
     * @memberof CanvasComponent
     */
    constructor(el: HTMLCanvasElement);
    /**
     * Retrieve the current presentation time (seconds)
     *
     * @readonly
     * @memberof CanvasComponent
     */
    get currentTime(): number;
    /**
     * Pause the presentation.
     *
     * @memberof CanvasComponent
     */
    pause(): void;
    /**
     * Start the presentation.
     *
     * @memberof CanvasComponent
     */
    play(): void;
    get bitrate(): number;
    get framerate(): number;
}
