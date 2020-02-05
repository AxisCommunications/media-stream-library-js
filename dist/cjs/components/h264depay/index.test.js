"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const validate_component_1 = require("../../utils/validate-component");
describe('is a valid component', () => {
    const c = new _1.H264Depay();
    validate_component_1.runComponentTests(c, 'h264Depay component');
});
//# sourceMappingURL=index.test.js.map