import { DesktopAgent, Context, IntentResolution, Listener, ContextHandler, Channel } from "@finos/fdc3";
import { AbstractDesktopAgentDelegate } from "../delegates/AbstractDesktopAgentDelegate";
import { SigningChannelDelegate } from "./SigningChannelDelegate";
import { Check, Sign, signedContext, wrapContextHandler } from "./SigningSupport";

/**
 * This implementation adds signing functionality to any broadcast context
 * and allows for the checking of signatures on items returned.
 */
export class SigningDesktopAgent extends AbstractDesktopAgentDelegate {

    private readonly sign: Sign
    private readonly check: Check

    constructor(d: DesktopAgent, sign: Sign, check: Check) {
        super(d)
        this.sign = sign
        this.check = check
    }

    wrapChannel(c: Channel): Channel {
        return new SigningChannelDelegate(c, this.sign, this.check)
    }

    broadcast(context: Context): Promise<void> {
        return signedContext(this.sign, context).then(sc => super.broadcast(sc))
    }

    raiseIntent(intentName: string, context: Context, a3: any): Promise<IntentResolution> {
        return signedContext(this.sign, context, intentName).then(sc => super.raiseIntent(intentName, sc, a3))
    }

    raiseIntentForContext(context: Context, a2?: any): Promise<IntentResolution> {
        return signedContext(this.sign, context).then(sc => super.raiseIntentForContext(sc, a2))
    }

    addContextListener(context: any, handler?: any): Promise<Listener> {
        const theHandler: ContextHandler = handler ? handler : (context as ContextHandler)
        const theContextType: string | null = context && handler ? (context as string) : null
        return super.addContextListener(theContextType, wrapContextHandler(this.check, theHandler))
    }

}