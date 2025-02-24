import type { Result } from '.';

export interface RequestNonce {
    req: { addr: string }
    res: Result<string>
    method: 'post'
    path: '/request_nonce'
}

export interface RequestToken {
    req: {
        signature: string
        pubKey: {
            type: string
            value: string
        }
        nonce: string
    }
    res: Result<string>
    method: 'post'
    path: '/request_token'
}

export interface CheckToken {
    req: never
    res: Result<{
        addr: string
        exp: number
    }>
    method: 'get'
    path: '/check_token'
}
