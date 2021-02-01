# Axios-NTLM

This is a helper library for NTLM Authentication using the Axios HTTP library on Node. It attaches interceptors to an axios instance to authenticate using NTLM for any resources that offer it.

## Examples

### Basic example

This example will create you a brand new axios instance you can utilise the same as any other axios instance

```ts

import { NtlmClient } from 'axios-ntlm';

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

```
### With an existing client

This shows how to pass in an existing axios instance to have the NTLM Auth interceptors attached.

**Note:** If doing this, be aware that http(s)Agents need to be attached to keep the connection alive. If there are none attached already, they will be added. If you are providing your own then you will need to set this up.

```ts

import { NtlmClient } from 'axios-ntlm';

(async () => {

    let client = axios.create(/*Your options here*/)
    
    client = NtlmClient('username', 'password', 'domain', 'workstation', client)

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

```