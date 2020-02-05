"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate_component_1 = require("../../utils/validate-component");
const _1 = require(".");
describe('is a valid component', () => {
    const c = new _1.RtspParser();
    validate_component_1.runComponentTests(c, 'Rtsp parser component');
});
//# sourceMappingURL=index.test.js.map