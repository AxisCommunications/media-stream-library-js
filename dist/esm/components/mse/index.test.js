// internal classes
import { MseSink } from '.';
// tests
import { runComponentTests } from '../../utils/validate-component';
const mse = new MseSink(document.createElement('video'));
runComponentTests(mse, 'media component');
//# sourceMappingURL=index.test.js.map