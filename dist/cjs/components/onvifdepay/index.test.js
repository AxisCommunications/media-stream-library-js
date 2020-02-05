"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const validate_component_1 = require("../../utils/validate-component");
describe('ONVIF depay component', () => {
    describe('is a valid component', () => {
        const c = new _1.ONVIFDepay(() => {
            /** noop */
        });
        validate_component_1.runComponentTests(c, 'ONVIF depay component');
    });
});
//# sourceMappingURL=index.test.js.map