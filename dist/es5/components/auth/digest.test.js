import { authHeaders, credentials, request, cnonce } from './fixtures';
import { DigestAuth } from './digest';
import { parseWWWAuthenticate } from './www-authenticate';
var header = authHeaders['WWW-Authenticate'];
describe('digest challenge', function () {
    it('generates the correct authentication header', function () {
        var challenge = parseWWWAuthenticate(header);
        var digest = new DigestAuth(challenge.params, credentials.username, credentials.password);
        // overwrite the cnonce function
        digest.cnonce = function () { return cnonce; };
        var authHeader = digest.authorization(request.method, request.uri);
        expect(authHeader).toEqual(authHeaders.Authorization);
    });
});
//# sourceMappingURL=digest.test.js.map