import { Channel, Context, ContextHandler, ContextMetadata, IntentHandler, IntentResult } from "@finos/fdc3"
import { SecuredDesktopAgent } from "../SecuredDesktopAgent"
import { handlePrivateChannelKeyShare } from "../encryption/EncryptionSupport"
import { canonicalize } from 'json-canonicalize';


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

export const SIGNING_ALGORITHM_KEY_PARAMS: EcKeyGenParams = {
    ...SIGNING_ALGORITHM_DETAILS,
    namedCurve: 'P-521'
}

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
    return canonicalize({
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

export function signingContextHandler(check: Check, handler: ContextHandler, channelProvider: () => Promise<Channel | null>): ContextHandler {
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


async function wrapIntentResult(ir: IntentResult, da: SecuredDesktopAgent, intentName: string, meta: ContextMetadataWithAuthenticity): Promise<IntentResult> {
    if (ir == undefined) {
        return
    } else if ((ir.type == 'app') || (ir.type == 'user') || (ir.type == 'private')) {
        // usual way to wrap channels
        const out = da.wrapChannel(ir as Channel)
        handlePrivateChannelKeyShare(out, meta)
        return out
    } else {
        // it's a context
        return signedContext(da.sign, ir as Context, intentName, undefined)
    }
}

export function signingIntentHandler(da: SecuredDesktopAgent, handler: IntentHandler, intentName: string): IntentHandler {

    const out = (c: Context, m: ContextMetadataWithAuthenticity | undefined) => {

        async function checkSignature(): Promise<{ context: Context, meta: ContextMetadataWithAuthenticity }> {
            const signature = c[SIGNATURE_KEY] as MessageSignature
            if (signature) {
                delete c[SIGNATURE_KEY]
                const toSign = await contentToSign(c, signature.date, intentName)
                const auth = await da.check(signature, toSign)
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
            const wrapped = await wrapIntentResult(result, da, intentName, meta)
            return wrapped
        }

        return checkSignature().then(({ context, meta }) => applyHandler(context, meta))

    }

    return out
}
