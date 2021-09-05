import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as ntlm from './ntlm';
import * as https from 'https'
import * as http from 'http'

export {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse};

/**
 * @property username The username of the user you are authenticating as.
 * @property password The password of the user you are authenticating as.
 * @property domain The domain of the user you are authenticating as.
 * @property workstation The workstation in use. Defaults to the current hostname if undefined.
 */
export interface NtlmCredentials {
    readonly username: string;
    readonly password: string;
    readonly domain: string;
    readonly workstation?: string;
}

/**
* @param credentials An NtlmCredentials object containing the username and password
* @param AxiosConfig The Axios config for the instance you wish to create
*
* @returns This function returns an axios instance configured to use the provided credentials
*/
export function NtlmClient(credentials: NtlmCredentials, AxiosConfig?: AxiosRequestConfig, ): AxiosInstance {
    let config: AxiosRequestConfig = AxiosConfig??{}

    if(!config.httpAgent) {
        config.httpAgent = new http.Agent({keepAlive: true}); 
    }

    if(!config.httpsAgent) {
        config.httpsAgent = new https.Agent({keepAlive: true}); 
    }

    let client = axios.create(config);

    client.interceptors.response.use((response) => {
        return response;
    }, (err:AxiosError) => {
        let error: AxiosResponse|undefined = err.response;

        if (error && error.status === 401
            && error.headers['www-authenticate']
            && error.headers['www-authenticate'].includes('NTLM')
            // This length check is a hack because SharePoint is awkward and will 
            // include the Negotiate option when responding with the T2 message
            // There is nore we could do to ensure we are processing correctly,
            // but this is the easiest option for now
            && error.headers['www-authenticate'].length < 50
            && !err.config.headers['X-retry']) {

            let t1Msg = ntlm.createType1Message(credentials.workstation!, credentials.domain);

            error.config.headers["Authorization"] = t1Msg;
            let resp = client(error.config);

            return resp;
        }
        else if (error && error.status === 401
            && error.headers['www-authenticate']
            && error.headers['www-authenticate'].length > 50
            && error.headers['www-authenticate'].includes('NTLM')) {
            
            let t2Msg = ntlm.decodeType2Message((error.headers['www-authenticate'].match(/^NTLM\s+(.+?)(,|\s+|$)/) || [])[1]);
            
            let t3Msg = ntlm.createType3Message(t2Msg, credentials.username, credentials.password, credentials.workstation!, credentials.domain);

            error.config.headers["Authorization"] = t3Msg;

            let resp = client(error.config);

            return resp;
        }
        else {
            throw err;
        }
    });

    return client;
    
}
