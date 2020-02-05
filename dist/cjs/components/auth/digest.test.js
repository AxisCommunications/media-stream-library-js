"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fixtures_1 = require("./fixtures");
const digest_1 = require("./digest");
const www_authenticate_1 = require("./www-authenticate");
const header = fixtures_1.authHeaders['WWW-Authenticate'];
describe('digest challenge', () => {
    it('generates the correct authentication header', () => {
        const challenge = www_authenticate_1.parseWWWAuthenticate(header);
        const digest = new digest_1.DigestAuth(challenge.params, fixtures_1.credentials.username, fixtures_1.credentials.password);
        // overwrite the cnonce function
        digest.cnonce = () => fixtures_1.cnonce;
        const authHeader = digest.authorization(fixtures_1.request.method, fixtures_1.request.uri);
        expect(authHeader).toEqual(fixtures_1.authHeaders.Authorization);
    });
});
//# sourceMappingURL=digest.test.js.map