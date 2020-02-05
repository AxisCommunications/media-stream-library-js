export class Pipeline {
    /**
     * Create a pipeline which is a linked list of components.
     * Works naturally with only a single component.
     * A set keeps track of which components the pipeline contains,
     * while any order is completely determined by the component's
     * connectedness.
     * @param {Array} components The components of the pipeline in order.
     */
    constructor(...components) {
        const [car, ...cdr] = components;
        this._set = new Set(components);
        this.firstComponent = car;
        this.lastComponent = cdr.reduce((last, component) => {
            return last.connect(component);
        }, car);
    }
    init(...components) {
        const [car, ...cdr] = components;
        this._set = new Set(components);
        this.firstComponent = car;
        this.lastComponent = cdr.reduce((last, component) => {
            return last.connect(component);
        }, car);
    }
    insertAfter(component, newComponent) {
        if (!this._set.has(component)) {
            throw new Error('insertion point not part of pipeline');
        }
        if (this._set.has(newComponent)) {
            throw new Error('new component already in the pipeline');
        }
        const cdr = component.next;
        if (cdr === null) {
            component.connect(newComponent);
            this.lastComponent = newComponent;
        }
        else {
            component.disconnect();
            component.connect(newComponent).connect(cdr);
        }
        this._set.add(newComponent);
        return this;
    }
    insertBefore(component, newComponent) {
        if (!this._set.has(component)) {
            throw new Error('insertion point not part of pipeline');
        }
        if (this._set.has(newComponent)) {
            throw new Error('new component already in the pipeline');
        }
        const car = component.prev;
        if (car === null) {
            newComponent.connect(component);
            this.firstComponent = newComponent;
        }
        else {
            car.disconnect();
            car.connect(newComponent).connect(component);
        }
        this._set.add(newComponent);
        return this;
    }
    remove(component) {
        if (!this._set.has(component)) {
            throw new Error('component not part of pipeline');
        }
        const car = component.prev;
        const cdr = component.next;
        if (car === null && cdr === null) {
            throw new Error('cannot remove last component');
        }
        else if (car === null && cdr !== null) {
            component.disconnect();
            this.firstComponent = cdr;
        }
        else if (car !== null && cdr === null) {
            car.disconnect();
            this.lastComponent = car;
        }
        else if (car !== null && cdr !== null) {
            car.disconnect();
            component.disconnect();
            car.connect(cdr);
        }
        this._set.delete(component);
        return this;
    }
    append(...components) {
        components.forEach(component => {
            this.insertAfter(this.lastComponent, component);
        });
        return this;
    }
    prepend(...components) {
        components.forEach(component => {
            this.insertBefore(this.firstComponent, component);
        });
        return this;
    }
}
//# sourceMappingURL=pipeline.js.map