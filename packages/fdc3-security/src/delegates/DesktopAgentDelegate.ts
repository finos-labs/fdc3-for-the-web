import { AppIdentifier, AppIntent, AppMetadata, Channel, Context, DesktopAgent, ImplementationMetadata, IntentHandler, IntentResolution, Listener, PrivateChannel } from "@finos/fdc3";

/**
 * This class implements a simple delegate, forwarding all 
 * behaviour to the 'd' member.
 */
export class DesktopAgentDelegate implements DesktopAgent {

    readonly d: DesktopAgent

    constructor(d: DesktopAgent) {
        this.d = d
    }

    open(a1: any, a2?: any): Promise<AppIdentifier> {
        return this.d.open(a1, a2)
    }

    findIntent(intent: string, context?: Context | undefined, resultType?: string | undefined): Promise<AppIntent> {
        return this.d.findIntent(intent, context, resultType)
    }

    findIntentsByContext(context: Context, resultType?: string | undefined): Promise<AppIntent[]> {
        return this.d.findIntentsByContext(context, resultType)
    }

    findInstances(app: AppIdentifier): Promise<AppIdentifier[]> {
        return this.d.findInstances(app)
    }

    broadcast(context: Context): Promise<void> {
        return this.d.broadcast(context)
    }

    raiseIntent(intent: string, context: Context, a3?: any): Promise<IntentResolution> {
        return this.d.raiseIntent(intent, context, a3)
    }

    raiseIntentForContext(context: Context, a2?: any): Promise<IntentResolution> {
        return this.d.raiseIntentForContext(context, a2)
    }

    addIntentListener(intent: string, handler: IntentHandler): Promise<Listener> {
        return this.d.addIntentListener(intent, handler)
    }

    addContextListener(a1: any, a2?: any): Promise<Listener> {
        return this.d.addContextListener(a1, a2)
    }

    getUserChannels(): Promise<Channel[]> {
        return this.d.getUserChannels()
    }

    joinUserChannel(channelId: string): Promise<void> {
        return this.d.joinUserChannel(channelId)
    }

    getOrCreateChannel(channelId: string): Promise<Channel> {
        return this.d.getOrCreateChannel(channelId)
    }

    createPrivateChannel(): Promise<PrivateChannel> {
        return this.d.createPrivateChannel()
    }

    getCurrentChannel(): Promise<Channel | null> {
        return this.d.getCurrentChannel()
    }

    leaveCurrentChannel(): Promise<void> {
        return this.d.leaveCurrentChannel()
    }

    getInfo(): Promise<ImplementationMetadata> {
        return this.d.getInfo()
    }

    getAppMetadata(app: AppIdentifier): Promise<AppMetadata> {
        return this.d.getAppMetadata(app)
    }

    getSystemChannels(): Promise<Channel[]> {
        return this.d.getSystemChannels()
    }

    joinChannel(channelId: string): Promise<void> {
        return this.d.joinChannel(channelId)
    }
}