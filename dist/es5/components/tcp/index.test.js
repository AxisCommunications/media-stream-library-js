import { TcpSource } from '.';
import { runComponentTests } from '../../utils/validate-component';
describe('is a valid component', function () {
    var c = new TcpSource();
    runComponentTests(c, 'TCP component');
});
//# sourceMappingURL=index.test.js.map