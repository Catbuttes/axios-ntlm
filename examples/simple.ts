import { AxiosRequestConfig } from 'axios';
import { NtlmClient, NtlmCredentials } from '../lib/ntlmClient';

(async () => {
    
    let credentials: NtlmCredentials = {
        username: 'username',
        password: "password",
        domain: 'domain'
    }

    let config: AxiosRequestConfig = {
        baseURL: 'https://protected.site.example.com',
        method: 'get'
    }

    let client = NtlmClient(credentials, config)

    try {
        let resp = await client.get('')
        console.log(resp);
    }
    catch (err) {
        console.log(err)
        console.log("Failed")
    }

})()