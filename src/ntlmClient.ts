import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import * as ntlm from 'ntlm-client'
import * as https from 'https'
import * as http from 'http'

/**
* @param username The username of the user you are authenticating as.
* @param password The password of the user you are authenticating as.
* @param domain The domain of the user you are authenticating as.
* @param workstation (optional) The workstation in use. Defaults to the current hostname if undefined.
* @param AxiosClient (optional) An existing axios client to attach NTLM Auth interceptors to. 
*
* @returns This function returns an axios instance configured to use the provided credentials
*/
export function NtlmClient(username: string, password: string, domain: string, workstation?: string, AxiosClient?: AxiosInstance, ): AxiosInstance {
    let client = AxiosClient;
    let httpAgent = new http.Agent({keepAlive: true}); 
    let httpsAgent = new https.Agent({keepAlive: true}); 

    if(!client)
    {
        client = axios.create({
            httpsAgent: httpsAgent,
            httpAgent: httpAgent
        });
    }
    

    client.interceptors.request.use((req) => {
        if(!req.httpAgent) {
            req.httpAgent = httpAgent;
        }
        if(!req.httpsAgent) {
            req.httpsAgent = httpsAgent;
        }
        return req;
    })

    client.interceptors.response.use((response) => {
        //console.log('Response:', response);
        return response;
    }, (err:AxiosError) => {
        let error: AxiosResponse|undefined = err.response;

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

            let t1Msg = ntlm.createType1Message(workstation!, domain);

            let resp = client!({
                method: err.config.method??'get',
                url: err.response?.config.url??'',
                headers: {
                    'Connection' : 'Keep-Alive',
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
                || error.headers['www-authenticate'].length > 50
            )
            && error.headers['www-authenticate'].includes('NTLM')) {
            
            let t2Msg = ntlm.decodeType2Message((error.headers['www-authenticate'].match(/^NTLM\s+(.+?)(,|\s+|$)/) || [])[1]);
            
            let t3Msg = ntlm.createType3Message(t2Msg, username, password, workstation!, domain);

            let resp = client!({
                method: err.config.method??'get',
                url: err.response?.config.url??'',
                headers: {
                    'X-retry' : 'false',
                    'Authorization': t3Msg
                }
            });

            return resp;
        }
    });

    return client;
    
}
