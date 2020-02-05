import { ChallengeParams } from './www-authenticate';
export declare class DigestAuth {
    private realm;
    private nonce;
    private opaque?;
    private algorithm?;
    private qop?;
    private username;
    private ha1Base;
    private count;
    constructor(params: ChallengeParams, username: string, password: string);
    nc: () => string;
    cnonce: () => string;
    ha1: (cnonce: string) => string;
    ha2: (method: string, uri: string, body?: string) => string;
    authorization: (method?: string, uri?: string, body?: string | undefined) => string;
}
