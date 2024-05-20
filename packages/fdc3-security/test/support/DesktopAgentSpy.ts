import { AppIdentifier, AppIntent, AppMetadata, Channel, Context, ContextHandler, DesktopAgent, DisplayMetadata, ImplementationMetadata, IntentHandler, IntentResolution, IntentResult, Listener, PrivateChannel } from "@finos/fdc3";
import { v4 as uuid } from 'uuid'

export interface Call {
    method: string,
    args: any[]
}

function addCall(a: Call[], method: string, arg0?: any, arg1?: any, arg2?: any) {
    const args = []
    if (arg0) {
        args.push(arg0)
    }

    if (arg1) {
        args.push(arg1)
    }

    if (arg2) {
        args.push(arg2)
    }

    a.push(
        {
            method,
            args
        }
    )
}

export class MockChannel implements Channel {

    readonly id: string
    readonly type: "user" | "app" | "private"
    readonly displayMetadata: DisplayMetadata
    public tracking: Call[] = []

    constructor(id: string, type: "user" | "app" | "private", displayMetadata: DisplayMetadata) {
        this.id = id;
        this.type = type
        this.displayMetadata = displayMetadata
    }

    call(method: string, arg0?: any, arg1?: any, arg2?: any) {
        addCall(this.tracking, method, arg0, arg1, arg2)
    }

    async broadcast(context: Context): Promise<void> {
        this.call("broadcast", context)
    }

    async getCurrentContext(type?: string | undefined): Promise<Context | null> {
        this.call("getCurrentContext", type)
        return null
    }

    addContextListener(_contextType: string | null | ContextHandler, _handler?: ContextHandler): Promise<Listener> {
        throw new Error("Method not implemented.");
    }
}

const MOCK_CHANNELS = [
    new MockChannel("one", "user", { color: "red" }),
    new MockChannel("two", "user", { color: "green" }),
    new MockChannel("three", "user", { color: "blue" })
]

/**
 * Keeps track of calls so that we can test out the delegation capabilities
 */
export class DesktopAgentSpy implements DesktopAgent {

    tracking: Call[] = []

    call(method: string, arg0?: any, arg1?: any, arg2?: any) {
        addCall(this.tracking, method, arg0, arg1, arg2)
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

    async findIntentsByContext(context: Context, resultType?: string | undefined): Promise<AppIntent[]> {
        this.call("findIntentsByContext", context, resultType)
        return []
    }

    async findInstances(app: AppIdentifier): Promise<AppIdentifier[]> {
        this.call("findInstances", app)
        return []
    }
    async broadcast(context: Context): Promise<void> {
        this.call("broadcast", context)
    }

    async raiseIntent(intent: string, context: Context, a2: any): Promise<IntentResolution> {
        this.call("raiseIntent", intent, context, a2)
        return {
            source: {
                appId: "abc123"
            },
            intent,
            getResult: async () => {
                return {

                } as IntentResult
            }
        } as IntentResolution
    }


    async raiseIntentForContext(context: Context, arg1?: any): Promise<IntentResolution> {
        this.call("raiseIntentForContext", context, arg1)
        return {
            source: {
                appId: "abc123"
            },
            intent: "showNews",
            getResult: async () => {
                return {

                } as IntentResult
            }
        } as IntentResolution
    }

    addIntentListener(_intent: string, _handler: IntentHandler): Promise<Listener> {
        throw new Error("Method not implemented.");
    }
    addContextListener(contextType: string | null, handler: ContextHandler): Promise<Listener>;
    addContextListener(handler: ContextHandler): Promise<Listener>;
    addContextListener(_contextType: unknown, _handler?: unknown): Promise<Listener> {
        throw new Error("Method not implemented.");
    }
    async getUserChannels(): Promise<Channel[]> {
        return MOCK_CHANNELS
    }
    joinUserChannel(_channelId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async getOrCreateChannel(channelId: string): Promise<Channel> {
        this.call("getOrCreateChannel", channelId)
        return new MockChannel(channelId, "app", {})
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
    getAppMetadata(_app: AppIdentifier): Promise<AppMetadata> {
        throw new Error("Method not implemented.");
    }
    getSystemChannels(): Promise<Channel[]> {
        throw new Error("Method not implemented.");
    }
    joinChannel(_channelId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

}