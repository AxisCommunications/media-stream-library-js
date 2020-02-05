"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWWWAuthenticate = (header) => {
    const [, type, ...challenge] = header.split(' ');
    const pairs = [];
    const re = /\s*([^=]+)=\"([^\"]*)\",?/gm;
    let match;
    do {
        match = re.exec(challenge.join(' '));
        if (match !== null) {
            const [, key, value] = match;
            pairs.push([key, value]);
        }
    } while (match !== null);
    const params = new Map(pairs);
    return { type: type.toLowerCase(), params };
};
//# sourceMappingURL=www-authenticate.js.map