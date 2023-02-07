import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as ntlm from './ntlm';
import * as https from 'https';
import * as http from 'http';
import devnull from 'dev-null';

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

    const client = axios.create(config);

    client.interceptors.response.use((response) => {
        return response;
    }, async (err:AxiosError) => {
        const error: AxiosResponse|undefined = err.response;

        if (error && error.status === 401
            && error.headers['www-authenticate']
            && error.headers['www-authenticate'].includes('NTLM')){

            // The header may look like this: `Negotiate, NTLM, Basic realm="itsahiddenrealm.example.net"`
            // so extract the 'NTLM' part first
            const ntlmheader = error.headers['www-authenticate'].split(',').find(_ => _.match(/ *NTLM/))?.trim() || '';

            // This length check is a hack because SharePoint is awkward and will
            // include the Negotiate option when responding with the T2 message
            // There is nore we could do to ensure we are processing correctly,
            // but this is the easiest option for now
            if (ntlmheader.length < 50){
                const t1Msg = ntlm.createType1Message(credentials.workstation!, credentials.domain);

                error.config.headers["Authorization"] = t1Msg;

            }
            else {
                const t2Msg = ntlm.decodeType2Message((ntlmheader.match(/^NTLM\s+(.+?)(,|\s+|$)/) || [])[1]);

                const t3Msg = ntlm.createType3Message(t2Msg, credentials.username, credentials.password, credentials.workstation!, credentials.domain);

                error.config.headers["X-retry"] = "false";
                error.config.headers["Authorization"] = t3Msg;
            }

            if (error.config.responseType === "stream"){
                const stream: http.IncomingMessage | undefined = err.response?.data;
                // Read Stream is holding HTTP connection open in our
                // TCP socket. Close stream to recycle back to the Agent.
                if (stream && !stream.readableEnded) {
                    await new Promise<void>(resolve => {
                        stream.pipe(devnull());
                        stream.once('close', resolve);
                    });
                }
            }

            return client(error.config);
        }


        else {
            throw err;
        }
    });

    return client;
    
}
