var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
export var parseWWWAuthenticate = function (header) {
    var _a = __read(header.split(' ')), type = _a[1], challenge = _a.slice(2);
    var pairs = [];
    var re = /\s*([^=]+)=\"([^\"]*)\",?/gm;
    var match;
    do {
        match = re.exec(challenge.join(' '));
        if (match !== null) {
            var _b = __read(match, 3), key = _b[1], value = _b[2];
            pairs.push([key, value]);
        }
    } while (match !== null);
    var params = new Map(pairs);
    return { type: type.toLowerCase(), params: params };
};
//# sourceMappingURL=www-authenticate.js.map