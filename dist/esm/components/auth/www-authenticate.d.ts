export declare type ChallengeParams = Map<string, string>;
export interface Challenge {
    type: string;
    params: ChallengeParams;
}
export declare const parseWWWAuthenticate: (header: string) => Challenge;
