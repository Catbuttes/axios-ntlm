declare const _exports: {
    createType1Message: typeof createType1Message;
    decodeType2Message: typeof decodeType2Message;
    createType3Message: typeof createType3Message;
};
export = _exports;
declare function createType1Message(workstation: any, target: any): string;
declare function decodeType2Message(str: any): {
    flags: any;
    encoding: string;
    version: number;
    challenge: any;
    targetName: any;
    targetInfo: {};
};
declare function createType3Message(type2Message: any, username: any, password: any, workstation: any, target: any): string;
//# sourceMappingURL=ntlm.d.ts.map