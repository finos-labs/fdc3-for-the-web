import { MessagingMiddleware } from 'fdc3-common'

export class SigningMiddleware implements MessagingMiddleware {

    constructor() {

    }

    preSend(msg: object): object {

        return msg;
    }
    postReceive(msg: object): object {
        return msg;
    }

}