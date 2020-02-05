import { runComponentTests } from '../../utils/validate-component';
import { JPEGDepay } from '.';
describe('JPEG depay component', function () {
    describe('is a valid component', function () {
        var c = new JPEGDepay();
        runComponentTests(c, 'JPEG depay component');
    });
});
//# sourceMappingURL=index.test.js.map