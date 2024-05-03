import { AppIdentifier } from "@finos/fdc3";
import { Messaging } from "../Messaging";
import { RegisterableListener } from "../listeners/RegisterableListener";
import { MessagingMiddleware } from "fdc3-common";

export abstract class AbstractMessaging implements Messaging {

    abstract getSource(): AppIdentifier
    abstract createUUID(): string
    abstract innerPost(message: object): Promise<void>
    abstract innerRegister(l: RegisterableListener): void
    abstract unregister(id: string): void

    abstract createMeta(): object

    protected readonly middlewares: MessagingMiddleware[]

    constructor(middlewares: MessagingMiddleware[]) {
        this.middlewares = middlewares
    }

    /**
     * This implementation handles preprocessing by middlewares
     */
    async post(message: object): Promise<void> {
        var m = message
        for (let i = 0; i < this.middlewares.length; i++) {
            m = await this.middlewares[i].preSend(m)
        }

        this.innerPost(m)
    }

    /**
     * This wraps the listener in the middleware
     */
    async register(l: RegisterableListener) {
        const _middlewares = this.middlewares

        const wrapped: RegisterableListener = {

            getId() {
                return l.getId()
            },

            filter: function (m: any): boolean {
                return l.filter(m)
            },

            action: async (message: any) => {
                var m = message
                for (let i = 0; i < _middlewares.length; i++) {
                    m = await _middlewares[i].postReceive(m)
                }

                l.action(m)
            },

            unsubscribe: function (): void {
                return l.unsubscribe()
            }
        }

        this.innerRegister(wrapped)
    }

    waitFor<X>(filter: (m: any) => boolean): Promise<X> {
        const id = this.createUUID()
        return new Promise<X>((resolve, _reject) => {
            this.register({
                getId: () => id,
                filter: filter,
                action: (m) => {
                    this.unregister(id)
                    resolve(m)
                }
            } as RegisterableListener);
        })
    }

    exchange<X>(message: any, expectedTypeName: string): Promise<X> {
        this.post(message)
        return this.waitFor(m =>
            (m.type == expectedTypeName)
            && ((m.meta.requestUuid == message.meta.requestUuid)
                || (message.meta.requestUuid == undefined)))
    }
}