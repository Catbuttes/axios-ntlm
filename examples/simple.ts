import { NtlmClient } from '../lib/ntlmClient';

(async () => {
    
    let client = NtlmClient('username', 'password', 'domain')

    try {
        let resp = await client({
            url: 'https://protected.site.example.com',
            method: 'get'
        });
        console.log(resp.data);
    }
    catch (err) {
        console.log(err)
        console.log("Failed")
    }

})()