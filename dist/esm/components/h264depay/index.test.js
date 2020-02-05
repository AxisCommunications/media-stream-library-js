import { H264Depay } from '.';
import { runComponentTests } from '../../utils/validate-component';
describe('is a valid component', () => {
    const c = new H264Depay();
    runComponentTests(c, 'h264Depay component');
});
//# sourceMappingURL=index.test.js.map