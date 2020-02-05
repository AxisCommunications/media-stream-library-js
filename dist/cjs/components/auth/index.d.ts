import { Tube } from '../component';
export interface AuthConfig {
    username?: string;
    password?: string;
}
export declare class Auth extends Tube {
    constructor(config?: AuthConfig);
}
