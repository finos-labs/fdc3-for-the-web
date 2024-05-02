import { MessagingMiddleware } from "fdc3-common";

export class LoggingMiddleware implements MessagingMiddleware {

    preSend(msg: object): object {
        console.log(`About to send: ${JSON.stringify(msg)}`)
        return msg
    }
    postReceive(msg: object): object {
        console.log(`Just received: ${JSON.stringify(msg)}`)
        return msg
    }


}