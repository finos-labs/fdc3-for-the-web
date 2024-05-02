import { MessagingMiddleware } from 'fdc3-common'

export class SigningMiddleware implements MessagingMiddleware {

    constructor() {

    }

    preSend(msg: any): object {
        msg.payload.signature = 'bobob'
        return msg;
    }

    postReceive(msg: object): object {
        return msg;
    }

}