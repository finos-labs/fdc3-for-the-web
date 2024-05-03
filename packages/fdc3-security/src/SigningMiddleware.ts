import { MessagingMiddleware } from 'fdc3-common'

export type Sign = (msg: string) => Promise<MessageSignature>
export type Check = (p: MessageSignature, msg: string) => Promise<MessageAuthenticity>
export type Encrypt = (msg: string) => Promise<string>
export type Decrypt = (msg: string) => Promise<string>

export type MessageSignature = {
    digest: string,
    certificateUrl: string,
    algorithm: any
}

export type MessageAuthenticity = {
    verified: boolean,
    valid: boolean,
    certificateUrl: string
    x509: any
}

const TYPES_TO_SIGN = [
    'broadcastRequest',
    'raiseIntentRequest',
    'PrivateChannel.broadcastRequest'
]

export class SigningMiddleware implements MessagingMiddleware {

    private readonly sign: Sign
    private readonly check: Check

    constructor(sign: Sign, check: Check) {
        this.sign = sign
        this.check = check
    }

    contentToSign(msg: any) {
        return JSON.stringify({
            type: msg.type,
            payload: msg.payload,
            meta: msg.meta
        })
    }

    async preSend(msg: any): Promise<object> {
        if (TYPES_TO_SIGN.includes(msg.type)) {
            msg.signature = await this.sign(this.contentToSign(msg))
        }

        return msg;
    }

    async postReceive(msg: any): Promise<object> {
        if (TYPES_TO_SIGN.includes(msg.type)) {
            const ps = msg.signature as MessageSignature
            if (ps) {
                msg.payload.metadata = {
                    ...msg.payload.metadata,
                    authenticity: await this.check(ps, this.contentToSign(msg))
                }
            } else {
                msg.payload.metadata = {
                    ...msg.payload.metadata,
                    authenticity: {
                        verified: false
                    } as MessageAuthenticity
                }
            }
        }
        return msg
    }
}