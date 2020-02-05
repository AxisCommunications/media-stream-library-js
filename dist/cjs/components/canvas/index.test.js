"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const validate_component_1 = require("../../utils/validate-component");
describe('Canvas component', () => {
    describe('is a valid component', () => {
        const fakeCanvas = document.createElement('canvas');
        fakeCanvas.getContext = () => null;
        const canvasComponent = new _1.CanvasSink(fakeCanvas);
        validate_component_1.runComponentTests(canvasComponent, 'Canvas component');
    });
});
//# sourceMappingURL=index.test.js.map