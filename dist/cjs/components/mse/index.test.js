"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// internal classes
const _1 = require(".");
// tests
const validate_component_1 = require("../../utils/validate-component");
const mse = new _1.MseSink(document.createElement('video'));
validate_component_1.runComponentTests(mse, 'media component');
//# sourceMappingURL=index.test.js.map