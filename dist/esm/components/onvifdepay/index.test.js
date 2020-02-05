import { ONVIFDepay } from '.';
import { runComponentTests } from '../../utils/validate-component';
describe('ONVIF depay component', () => {
    describe('is a valid component', () => {
        const c = new ONVIFDepay(() => {
            /** noop */
        });
        runComponentTests(c, 'ONVIF depay component');
    });
});
//# sourceMappingURL=index.test.js.map