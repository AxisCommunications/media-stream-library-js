var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var Pipeline = /** @class */ (function () {
    /**
     * Create a pipeline which is a linked list of components.
     * Works naturally with only a single component.
     * A set keeps track of which components the pipeline contains,
     * while any order is completely determined by the component's
     * connectedness.
     * @param {Array} components The components of the pipeline in order.
     */
    function Pipeline() {
        var components = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            components[_i] = arguments[_i];
        }
        var _a = __read(components), car = _a[0], cdr = _a.slice(1);
        this._set = new Set(components);
        this.firstComponent = car;
        this.lastComponent = cdr.reduce(function (last, component) {
            return last.connect(component);
        }, car);
    }
    Pipeline.prototype.init = function () {
        var components = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            components[_i] = arguments[_i];
        }
        var _a = __read(components), car = _a[0], cdr = _a.slice(1);
        this._set = new Set(components);
        this.firstComponent = car;
        this.lastComponent = cdr.reduce(function (last, component) {
            return last.connect(component);
        }, car);
    };
    Pipeline.prototype.insertAfter = function (component, newComponent) {
        if (!this._set.has(component)) {
            throw new Error('insertion point not part of pipeline');
        }
        if (this._set.has(newComponent)) {
            throw new Error('new component already in the pipeline');
        }
        var cdr = component.next;
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
    };
    Pipeline.prototype.insertBefore = function (component, newComponent) {
        if (!this._set.has(component)) {
            throw new Error('insertion point not part of pipeline');
        }
        if (this._set.has(newComponent)) {
            throw new Error('new component already in the pipeline');
        }
        var car = component.prev;
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
    };
    Pipeline.prototype.remove = function (component) {
        if (!this._set.has(component)) {
            throw new Error('component not part of pipeline');
        }
        var car = component.prev;
        var cdr = component.next;
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
    };
    Pipeline.prototype.append = function () {
        var _this = this;
        var components = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            components[_i] = arguments[_i];
        }
        components.forEach(function (component) {
            _this.insertAfter(_this.lastComponent, component);
        });
        return this;
    };
    Pipeline.prototype.prepend = function () {
        var _this = this;
        var components = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            components[_i] = arguments[_i];
        }
        components.forEach(function (component) {
            _this.insertBefore(_this.firstComponent, component);
        });
        return this;
    };
    return Pipeline;
}());
export { Pipeline };
//# sourceMappingURL=pipeline.js.map