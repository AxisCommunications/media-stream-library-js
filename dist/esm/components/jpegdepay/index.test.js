import { runComponentTests } from '../../utils/validate-component';
import { JPEGDepay } from '.';
describe('JPEG depay component', () => {
    describe('is a valid component', () => {
        const c = new JPEGDepay();
        runComponentTests(c, 'JPEG depay component');
    });
});
//# sourceMappingURL=index.test.js.map