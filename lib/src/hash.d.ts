declare const _exports: {
    createLMHash: typeof createLMHash;
    createNTLMHash: typeof createNTLMHash;
    createLMResponse: typeof createLMResponse;
    createNTLMResponse: typeof createNTLMResponse;
    createLMv2Response: typeof createLMv2Response;
    createNTLMv2Response: typeof createNTLMv2Response;
    createPseudoRandomValue: typeof createPseudoRandomValue;
};
export = _exports;
declare function createLMResponse(challenge: any, lmhash: any): any;
declare function createLMHash(password: any): any;
declare function createNTLMResponse(challenge: any, ntlmhash: any): any;
declare function createNTLMHash(password: any): Buffer<any>;
declare function createLMv2Response(type2message: any, username: any, ntlmhash: any, nonce: any, targetName: any): any;
declare function createNTLMv2Response(type2message: any, username: any, ntlmhash: any, nonce: any, targetName: any): any;
declare function createPseudoRandomValue(length: any): string;
//# sourceMappingURL=hash.d.ts.map