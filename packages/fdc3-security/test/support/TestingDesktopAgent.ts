import { AppIdentifier, AppIntent, AppMetadata, Channel, Context, ContextHandler, DesktopAgent, ImplementationMetadata, IntentHandler, IntentResolution, Listener, PrivateChannel } from "@finos/fdc3";
import { v4 as uuid } from 'uuid'

export interface Call {
    method: string,
    args: any[]
}


/**
 * 
 * Keeps track of calls so that we can test out the delegation capabilities
 */
export class TestingDesktopAgent implements DesktopAgent {

    tracking: Call[] = []

    call(method: string, arg0?: any, arg1?: any) {
        const args = []
        if (arg0) {
            args.push(arg0)
        }

        if (arg1) {
            args.push(arg1)
        }

        this.tracking.push(
            {
                method,
                args
            }
        )
    }

    async open(arg0?: any, arg1?: any): Promise<AppIdentifier> {
        this.call("open", arg0, arg1)
        return {
            appId: "DummyApp",
            instanceId: uuid()
        } as AppIdentifier
    }

    async findIntent(intent: string, context?: Context | undefined, resultType?: string | undefined): Promise<AppIntent> {
        this.call("findIntent", context, resultType)
        return {
            intent: {
                name: intent,
                displayName: "Some Display Name"
            },
            apps: []
        } as AppIntent
    }

    findIntentsByContext(context: Context, resultType?: string | undefined): Promise<AppIntent[]> {
        throw new Error("Method not implemented.");
    }
    findInstances(app: AppIdentifier): Promise<AppIdentifier[]> {
        throw new Error("Method not implemented.");
    }
    broadcast(context: Context): Promise<void> {
        throw new Error("Method not implemented.");
    }
    raiseIntent(intent: string, context: Context, app?: AppIdentifier | undefined): Promise<IntentResolution>;
    raiseIntent(intent: string, context: Context, name: string): Promise<IntentResolution>;
    raiseIntent(intent: unknown, context: unknown, name?: unknown): Promise<IntentResolution> {
        throw new Error("Method not implemented.");
    }
    raiseIntentForContext(context: Context, app?: AppIdentifier | undefined): Promise<IntentResolution>;
    raiseIntentForContext(context: Context, name: string): Promise<IntentResolution>;
    raiseIntentForContext(context: unknown, name?: unknown): Promise<IntentResolution> {
        throw new Error("Method not implemented.");
    }
    addIntentListener(intent: string, handler: IntentHandler): Promise<Listener> {
        throw new Error("Method not implemented.");
    }
    addContextListener(contextType: string | null, handler: ContextHandler): Promise<Listener>;
    addContextListener(handler: ContextHandler): Promise<Listener>;
    addContextListener(contextType: unknown, handler?: unknown): Promise<Listener> {
        throw new Error("Method not implemented.");
    }
    getUserChannels(): Promise<Channel[]> {
        throw new Error("Method not implemented.");
    }
    joinUserChannel(channelId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getOrCreateChannel(channelId: string): Promise<Channel> {
        throw new Error("Method not implemented.");
    }
    createPrivateChannel(): Promise<PrivateChannel> {
        throw new Error("Method not implemented.");
    }
    getCurrentChannel(): Promise<Channel | null> {
        throw new Error("Method not implemented.");
    }
    leaveCurrentChannel(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getInfo(): Promise<ImplementationMetadata> {
        throw new Error("Method not implemented.");
    }
    getAppMetadata(app: AppIdentifier): Promise<AppMetadata> {
        throw new Error("Method not implemented.");
    }
    getSystemChannels(): Promise<Channel[]> {
        throw new Error("Method not implemented.");
    }
    joinChannel(channelId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

}