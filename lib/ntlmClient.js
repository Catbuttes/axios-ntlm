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
var ntlm = __importStar(require("./ntlm"));
var https = __importStar(require("https"));
var http = __importStar(require("http"));
/**
* @param credentials An NtlmCredentials object containing the username and password
* @param AxiosConfig The Axios config for the instance you wish to create
*
* @returns This function returns an axios instance configured to use the provided credentials
*/
function NtlmClient(credentials, AxiosConfig) {
    var config = AxiosConfig !== null && AxiosConfig !== void 0 ? AxiosConfig : {};
    if (!config.httpAgent) {
        config.httpAgent = new http.Agent({ keepAlive: true });
    }
    if (!config.httpsAgent) {
        config.httpsAgent = new https.Agent({ keepAlive: true });
    }
    var client = axios_1.default.create(config);
    client.interceptors.response.use(function (response) {
        return response;
    }, function (err) {
        var error = err.response;
        if (error && error.status === 401
            && error.headers['www-authenticate']
            && error.headers['www-authenticate'].includes('NTLM')
            // This length check is a hack because SharePoint is awkward and will 
            // include the Negotiate option when responding with the T2 message
            // There is nore we could do to ensure we are processing correctly,
            // but this is the easiest option for now
            && error.headers['www-authenticate'].length < 50
            && !err.config.headers['X-retry']) {
            var t1Msg = ntlm.createType1Message(credentials.workstation, credentials.domain);
            error.config.headers["Authorization"] = t1Msg;
            var resp = client(error.config);
            return resp;
        }
        else if (error && error.status === 401
            && error.headers['www-authenticate']
            && error.headers['www-authenticate'].length > 50
            && error.headers['www-authenticate'].includes('NTLM')) {
            var t2Msg = ntlm.decodeType2Message((error.headers['www-authenticate'].match(/^NTLM\s+(.+?)(,|\s+|$)/) || [])[1]);
            var t3Msg = ntlm.createType3Message(t2Msg, credentials.username, credentials.password, credentials.workstation, credentials.domain);
            error.config.headers["X-retry"] = "false";
            error.config.headers["Authorization"] = t3Msg;
            var resp = client(error.config);
            return resp;
        }
        else {
            throw err;
        }
    });
    return client;
}
exports.NtlmClient = NtlmClient;
//# sourceMappingURL=ntlmClient.js.map