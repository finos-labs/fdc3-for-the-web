import { Channel, Context, ContextHandler, ContextMetadata } from "@finos/fdc3"

export type Sign = (msg: string, date: Date) => Promise<MessageSignature>
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
    algorithm: any,
    date: Date
}

export type MessageAuthenticity = {
    verified: boolean,
    valid: boolean,
    publicKeyUrl: string
}

export type ContextMetadataWithAuthenticity = ContextMetadata & {
    authenticity?: MessageAuthenticity
}

export async function contentToSign(context: Context, timestamp: Date, intent?: string, channelId?: string): Promise<string> {
    return JSON.stringify({
        context,
        intent,
        timestamp,
        channelId
    })
}

export async function signedContext(sign: Sign, context: Context, intent?: string, channelId?: string): Promise<Context> {
    delete context[SIGNATURE_KEY]
    const ts = new Date()
    return sign(await contentToSign(context, ts, intent, channelId), ts).then(sig => {
        context[SIGNATURE_KEY] = sig
        return context
    })
}

export function wrapContextHandler(check: Check, handler: ContextHandler, channelProvider: () => Promise<Channel | null>): ContextHandler {
    const out = (c: Context, m: ContextMetadataWithAuthenticity) => {

        if (c[SIGNATURE_KEY]) {
            // context is signed, so check it.
            const signature = c[SIGNATURE_KEY] as MessageSignature
            delete c[SIGNATURE_KEY]

            channelProvider()
                .then(channel => contentToSign(c, signature.date, undefined, channel?.id))
                .then(messageToCheck => check(signature, messageToCheck))
                .then(r => {
                    const m2: ContextMetadataWithAuthenticity = (m == undefined) ? {} as ContextMetadataWithAuthenticity : m
                    m2[AUTHENTICITY_KEY] = r
                    handler(c, m2)
                })
        } else {
            delete m[AUTHENTICITY_KEY]
            return handler(c, m)
        }
    }

    return out as ContextHandler
}