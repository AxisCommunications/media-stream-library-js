"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate_component_1 = require("../../utils/validate-component");
const _1 = require(".");
describe('JPEG depay component', () => {
    describe('is a valid component', () => {
        const c = new _1.JPEGDepay();
        validate_component_1.runComponentTests(c, 'JPEG depay component');
    });
});
//# sourceMappingURL=index.test.js.map