import { MessagingMiddleware } from "fdc3-common";

export class LoggingMiddleware implements MessagingMiddleware {

    async preSend(msg: object): Promise<object> {
        console.log(`About to send: ${JSON.stringify(msg)}`)
        return msg
    }

    async postReceive(msg: object): Promise<object> {
        console.log(`Just received: ${JSON.stringify(msg)}`)
        return msg
    }


}