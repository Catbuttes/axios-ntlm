"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosError = void 0;
exports.NtlmClient = NtlmClient;
const axios_1 = __importStar(require("axios"));
Object.defineProperty(exports, "AxiosError", { enumerable: true, get: function () { return axios_1.AxiosError; } });
const ntlm = __importStar(require("./ntlm"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const NTLM_HANDSHAKE_DONE = Symbol('ntlmHandshakeDone');
/**
* @param credentials An NtlmCredentials object containing the username and password
* @param AxiosConfig The Axios config for the instance you wish to create
*
* @returns This function returns an axios instance configured to use the provided credentials
*/
function NtlmClient(credentials, AxiosConfig) {
    let config = AxiosConfig !== null && AxiosConfig !== void 0 ? AxiosConfig : {};
    if (!config.httpAgent) {
        config.httpAgent = new http.Agent({ keepAlive: true });
    }
    if (!config.httpsAgent) {
        config.httpsAgent = new https.Agent({ keepAlive: true });
    }
    const client = axios_1.default.create(config);
    client.interceptors.response.use((response) => {
        return response;
    }, (err) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const error = err.response;
        if (error && error.status === 401
            && error.headers['www-authenticate']
            && error.headers['www-authenticate'].includes('NTLM')
            && !err.config[NTLM_HANDSHAKE_DONE]) {
            // The header may look like this: `Negotiate, NTLM, Basic realm="itsahiddenrealm.example.net"`
            // so extract the 'NTLM' part first
            const ntlmheader = ((_a = error.headers['www-authenticate'].split(',').find((header) => header.match(/ *NTLM/))) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            // This length check is a hack because SharePoint is awkward and will
            // include the Negotiate option when responding with the T2 message
            // There is nore we could do to ensure we are processing correctly,
            // but this is the easiest option for now
            if (ntlmheader.length < 50) {
                const t1Msg = ntlm.createType1Message(credentials.workstation, credentials.domain);
                error.config.headers["Authorization"] = t1Msg;
            }
            else {
                const t2Msg = ntlm.decodeType2Message((ntlmheader.match(/^NTLM\s+(.+?)(,|\s+|$)/) || [])[1]);
                const t3Msg = ntlm.createType3Message(t2Msg, credentials.username, credentials.password, credentials.workstation, credentials.domain);
                err.config[NTLM_HANDSHAKE_DONE] = true;
                error.config.headers["Authorization"] = t3Msg;
            }
            if (error.config.responseType === "stream") {
                const stream = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data;
                // Read Stream is holding HTTP connection open in our
                // TCP socket. Close stream to recycle back to the Agent.
                if (stream && !stream.readableEnded) {
                    yield new Promise(resolve => {
                        stream.resume();
                        stream.once('close', resolve);
                    });
                }
            }
            return client(error.config);
        }
        else {
            throw err;
        }
    }));
    return client;
}
//# sourceMappingURL=ntlmClient.js.map