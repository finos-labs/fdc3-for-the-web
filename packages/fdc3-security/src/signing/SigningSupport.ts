import { Context, ContextHandler, ContextMetadata } from "@finos/fdc3"

export type Sign = (msg: string) => Promise<MessageSignature>
export type Check = (p: MessageSignature, msg: string) => Promise<MessageAuthenticity>
export type Encrypt = (msg: string) => Promise<string>
export type Decrypt = (msg: string) => Promise<string>

/**
 * This is the field that is added to the context object to contain the signature
 */
export const SIGNATURE_KEY = "__signature"
export const AUTHENTICITY_KEY = "authenticity"

export type MessageSignature = {
    digest: string,
    publicKeyUrl: string,
    algorithm: any
}

export type MessageAuthenticity = {
    verified: boolean,
    valid: boolean,
    publicKeyUrl: string
}

export type ContextMetadataWithAuthenticity = ContextMetadata & {
    authenticity?: MessageAuthenticity
}

export function contentToSign(context: Context, intent?: string, channelId?: string): string {
    const timestamp = new Date()
    return JSON.stringify({
        context,
        intent,
        timestamp,
        channelId
    })
}

export function signedContext(sign: Sign, context: Context, intent?: string, channelId?: string): Promise<Context> {
    delete context[SIGNATURE_KEY]
    return sign(contentToSign(context, intent, channelId)).then(sig => {
        context[SIGNATURE_KEY] = sig
        return context
    })
}

export function wrapContextHandler(check: Check, handler: ContextHandler): ContextHandler {
    const out = (c: Context, m: ContextMetadataWithAuthenticity) => {

        if (c[SIGNATURE_KEY]) {
            // context is signed, so check it.
            const signature = c[SIGNATURE_KEY] as MessageSignature
            delete c[SIGNATURE_KEY]

            const messageToCheck = contentToSign(c, undefined, undefined)

            check(signature, messageToCheck).then(r => {
                (m as any)[AUTHENTICITY_KEY] = r
                handler(c, m)
            })
        } else {
            delete m[AUTHENTICITY_KEY]
            return handler(c, m)
        }
    }

    return out as ContextHandler
}