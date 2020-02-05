import { Component, Tube, Sink, Source } from '../components/component';
export declare class Pipeline {
    firstComponent: Component;
    lastComponent: Component;
    private _set;
    /**
     * Create a pipeline which is a linked list of components.
     * Works naturally with only a single component.
     * A set keeps track of which components the pipeline contains,
     * while any order is completely determined by the component's
     * connectedness.
     * @param {Array} components The components of the pipeline in order.
     */
    constructor(...components: Component[]);
    init(...components: Component[]): void;
    insertAfter(component: Source | Tube, newComponent: Tube | Sink): this;
    insertBefore(component: Tube | Sink, newComponent: Source | Tube): this;
    remove(component: Component): this;
    append(...components: Array<Tube | Sink>): this;
    prepend(...components: Array<Source | Tube>): this;
}
