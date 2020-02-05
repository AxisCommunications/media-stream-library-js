import { CanvasSink } from '.';
import { runComponentTests } from '../../utils/validate-component';
describe('Canvas component', function () {
    describe('is a valid component', function () {
        var fakeCanvas = document.createElement('canvas');
        fakeCanvas.getContext = function () { return null; };
        var canvasComponent = new CanvasSink(fakeCanvas);
        runComponentTests(canvasComponent, 'Canvas component');
    });
});
//# sourceMappingURL=index.test.js.map