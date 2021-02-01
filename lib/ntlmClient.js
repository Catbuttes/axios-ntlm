"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NtlmClient = void 0;
var axios_1 = __importDefault(require("axios"));
var ntlm = __importStar(require("ntlm-client"));
var https = __importStar(require("https"));
var http = __importStar(require("http"));
/*
* @param username The username of the user you are authenticating as.
* @param password The password of the user you are authenticating as.
* @param domain The domain of the user you are authenticating as.
* @param workstation (optional) The workstation in use. Defaults to the current hostname if undefined.
* @param AxiosClient (optional) An existing axios client to attach NTLM Auth interceptors to.
*/
function NtlmClient(username, password, domain, workstation, AxiosClient) {
    var client = AxiosClient;
    var httpAgent = new http.Agent({ keepAlive: true });
    var httpsAgent = new https.Agent({ keepAlive: true });
    if (!client) {
        client = axios_1.default.create({
            httpsAgent: httpsAgent,
            httpAgent: httpAgent
        });
    }
    client.interceptors.request.use(function (req) {
        if (!req.httpAgent) {
            req.httpAgent = httpAgent;
        }
        if (!req.httpsAgent) {
            req.httpsAgent = httpsAgent;
        }
        return req;
    });
    client.interceptors.response.use(function (response) {
        //console.log('Response:', response);
        return response;
    }, function (err) {
        var _a, _b, _c, _d, _e, _f;
        var error = err.response;
        if (error && error.status === 401
            && error.headers['www-authenticate']
            && error.headers['www-authenticate'].includes('Negotiate')
            && error.headers['www-authenticate'].includes('NTLM')
            // This length check is a hack because SharePoint is awkward and will 
            // include the Negotiate option when responding with the T2 message
            // There is nore we could do to ensure we are processing correctly,
            // but this is the easiest option for now
            && error.headers['www-authenticate'].length < 50
            && !err.config.headers['X-retry']) {
            var t1Msg = ntlm.createType1Message(workstation, domain);
            var resp = client({
                method: (_a = err.config.method) !== null && _a !== void 0 ? _a : 'get',
                url: (_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.config.url) !== null && _c !== void 0 ? _c : '',
                headers: {
                    'Connection': 'Keep-Alive',
                    'Authorization': t1Msg
                }
            });
            return resp;
        }
        else if (error && error.status === 401
            && error.headers['www-authenticate']
            && (!error.headers['www-authenticate'].includes('Negotiate')
                // This length check is a hack because SharePoint is awkward and will 
                // include the Negotiate option when responding with the T2 message
                // There is more we could do to ensure we are processing correctly,
                // but this is the easiest option for now
                || error.headers['www-authenticate'].length > 50)
            && error.headers['www-authenticate'].includes('NTLM')) {
            var t2Msg = ntlm.decodeType2Message((error.headers['www-authenticate'].match(/^NTLM\s+(.+?)(,|\s+|$)/) || [])[1]);
            var t3Msg = ntlm.createType3Message(t2Msg, username, password, workstation, domain);
            var resp = client({
                method: (_d = err.config.method) !== null && _d !== void 0 ? _d : 'get',
                url: (_f = (_e = err.response) === null || _e === void 0 ? void 0 : _e.config.url) !== null && _f !== void 0 ? _f : '',
                headers: {
                    'X-retry': 'false',
                    'Authorization': t3Msg
                }
            });
            return resp;
        }
    });
    return client;
}
exports.NtlmClient = NtlmClient;
//# sourceMappingURL=ntlmClient.js.map