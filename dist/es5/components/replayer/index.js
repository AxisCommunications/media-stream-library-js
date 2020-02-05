var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { Readable, Writable } from 'stream';
import { Source } from '../component';
import { readFileSync } from 'fs';
import { join } from 'path';
import StreamFactory from '../helpers/stream-factory';
import { sleep } from '../helpers/sleep';
var Replayer = /** @class */ (function (_super) {
    __extends(Replayer, _super);
    /**
     * Create a new replay component that will play provided data.
     * The packets need to conform to the format:
     * {
     *   type: 'incoming'/'outgoing',
     *   delay: Number,
     *   msg: Object (original message)
     * }
     * @param {String} data The JSON data to replay.
     * @return {undefined}
     */
    function Replayer(packetStream) {
        var _this = this;
        var finished = false;
        var incoming = new Readable({
            objectMode: true,
            read: function () {
                //
            },
        });
        /**
         * Emit incoming items in the queue until an outgoing item is found.
         * @param  {Function} callback Call to signal completion.
         * @return {Promise}           undefined
         */
        var start = function () { return __awaiter(_this, void 0, void 0, function () {
            var packet;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        packet = packetStream.read();
                        _a.label = 1;
                    case 1:
                        if (!(packet && packet.type === 'incoming')) return [3 /*break*/, 3];
                        return [4 /*yield*/, sleep(packet.delay)];
                    case 2:
                        _a.sent();
                        incoming.push(packet.msg);
                        packet = packetStream.read();
                        return [3 /*break*/, 1];
                    case 3:
                        if (finished) {
                            incoming.push(null);
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        var outgoing = new Writable({
            objectMode: true,
            write: function (msg, encoding, callback) {
                start().catch(function () {
                    /** ignore */
                }); // resume streaming
                callback();
            },
        });
        outgoing.on('finish', function () {
            finished = true;
        });
        outgoing.on('pipe', function () { return start(); });
        _this = _super.call(this, incoming, outgoing) || this;
        return _this;
    }
    /**
     * Create a new replay component that will play from a file.
     * @param {String} filename The name of the file (relative to cwd)
     * @return {ReplayComponent}
     */
    Replayer.fromFile = function (filename) {
        if (filename === void 0) { filename = 'data.json'; }
        var cwd = process.cwd();
        var data = readFileSync(join(cwd, filename));
        var packets = JSON.parse(data.toString());
        var packetStream = StreamFactory.replayer(packets);
        return new Replayer(packetStream);
    };
    return Replayer;
}(Source));
export { Replayer };
//# sourceMappingURL=index.js.map