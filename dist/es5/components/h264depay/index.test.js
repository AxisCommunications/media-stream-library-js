import { H264Depay } from '.';
import { runComponentTests } from '../../utils/validate-component';
describe('is a valid component', function () {
    var c = new H264Depay();
    runComponentTests(c, 'h264Depay component');
});
//# sourceMappingURL=index.test.js.map