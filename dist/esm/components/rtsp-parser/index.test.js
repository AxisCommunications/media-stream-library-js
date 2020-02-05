import { runComponentTests } from '../../utils/validate-component';
import { RtspParser } from '.';
describe('is a valid component', () => {
    const c = new RtspParser();
    runComponentTests(c, 'Rtsp parser component');
});
//# sourceMappingURL=index.test.js.map