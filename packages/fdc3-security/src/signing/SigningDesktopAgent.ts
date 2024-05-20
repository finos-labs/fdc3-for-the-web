import { DesktopAgent, Context, IntentResolution } from "@finos/fdc3";
import { DesktopAgentDelegate } from "../delegates/DesktopAgentDelegate";
import { Check, Sign } from "../SigningMiddleware";


/**
 * This is the field that is added to the context object to contain the signature
 */
export const SIGNATURE_KEY = "__signature"

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

/**
 * This implementation adds signing functionality to any broadcast context
 * and allows for the checking of signatures on items returned.
 */
export class SigningDesktopAgent extends DesktopAgentDelegate {

    private readonly sign: Sign
    private readonly check: Check

    constructor(d: DesktopAgent, sign: Sign, check: Check) {
        super(d)
        this.sign = sign
        this.check = check
    }

    contentToSign(context: Context, intent?: string, channelId?: string) {
        const timestamp = new Date()
        return JSON.stringify({
            context,
            intent,
            timestamp,
            channelId
        })
    }

    private signedContext(context: Context): Context {
        context[SIGNATURE_KEY] = this.sign(this.contentToSign(context))
        return context
    }

    broadcast(context: Context): Promise<void> {
        return super.broadcast(this.signedContext(context))
    }

    raiseIntent(a1: any, a2: any, a3: any): Promise<IntentResolution> {

    }
}