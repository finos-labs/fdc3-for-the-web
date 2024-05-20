import { Channel, Context, ContextHandler, DisplayMetadata, Listener } from "@finos/fdc3";

/**
 * Wraps a standard FDC3 channel
 */
export class ChannelDelegate implements Channel {

    readonly c: Channel
    id: string;
    type: "user" | "app" | "private";
    displayMetadata?: DisplayMetadata | undefined;

    constructor(c: Channel) {
        this.c = c
        this.id = c.id
        this.type = c.type
        this.displayMetadata = c.displayMetadata
    }

    broadcast(context: Context): Promise<void> {
        return this.c.broadcast(context)
    }

    getCurrentContext(contextType?: string | undefined): Promise<Context | null> {
        return this.c.getCurrentContext(contextType)
    }

    addContextListener(a1: any, a2?: any): Promise<Listener> {
        return this.c.addContextListener(a1, a2)
    }

}