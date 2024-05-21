import { Channel, Context, ContextHandler, ContextMetadata, IntentHandler, IntentResult } from "@finos/fdc3"

export type Sign = (msg: string, date: Date) => Promise<MessageSignature>
export type Check = (p: MessageSignature, msg: string) => Promise<MessageAuthenticity>

/**
 * This is the field that is added to the context object to contain the signature
 */
export const SIGNATURE_KEY = "__signature"
export const AUTHENTICITY_KEY = "authenticity"

export const SIGNING_ALGORITHM_DETAILS = {
    name: "ECDSA",
    hash: "SHA-512",
    namedCurve: 'P-521'
} as EcdsaParams


export type MessageSignature = {
    digest: string,
    publicKeyUrl: string,
    algorithm: any,
    date: string
}

export type MessageAuthenticity = {
    verified: true,
    valid: boolean,
    publicKeyUrl: string
} | {
    verified: false
}

export type ContextMetadataWithAuthenticity = ContextMetadata & {
    authenticity?: MessageAuthenticity
}

export async function contentToSign(context: Context, timestamp: string, intent?: string, channelId?: string): Promise<string> {
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
    return sign(await contentToSign(context, JSON.stringify(ts), intent, channelId), ts).then(sig => {
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

async function wrapIntentResult(ir: IntentResult, sign: Sign, intentName: string): Promise<IntentResult> {
    if (ir == undefined) {
        return
    } else if (ir.type) {
        // it's a context
        return signedContext(sign, ir as Context, intentName, undefined)
    } else {
        // it's a private channel
        return ir
    }
}

export function wrapIntentHandler(sign: Sign, check: Check, handler: IntentHandler, intentName: string): IntentHandler {

    const out = (c: Context, m: ContextMetadataWithAuthenticity | undefined) => {

        async function checkSignature(): Promise<{ context: Context, meta: ContextMetadataWithAuthenticity }> {
            const signature = c[SIGNATURE_KEY] as MessageSignature
            if (signature) {
                delete c[SIGNATURE_KEY]
                const toSign = await contentToSign(c, signature.date, intentName)
                const auth = await check(signature, toSign)
                return {
                    context: c,
                    meta: {
                        ...m as any,
                        authenticity: auth
                    }
                }
            } else {
                return {
                    context: c,
                    meta: {
                        ...m as any,
                        authenticity: {
                            verified: false
                        }
                    }
                }
            }
        }

        async function applyHandler(context: Context, meta: ContextMetadata): Promise<IntentResult> {
            const result = await handler(context, meta)
            const wrapped = await wrapIntentResult(result, sign, intentName)
            return wrapped
        }

        return checkSignature().then(({ context, meta }) => applyHandler(context, meta))

    }

    return out
}
