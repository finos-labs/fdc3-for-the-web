import { Check, MessageSignature, Sign, SigningMiddleware } from "../../../src/SigningMiddleware";



const dummySign: Sign = async (msg: string) => {
    const out = {
        digest: "length: " + msg.length,
        publicKeyUrl: "https://dummy.com/pubKey",
        algorithm: "LENGTH-CHECK"
    } as MessageSignature
    return out;
}

const dummyCheck: Check = async (p: MessageSignature, msg: string) => {
    const out = {
        valid: p.digest == ("length: " + msg.length),
        verified: true,
        publicKeyUrl: p.publicKeyUrl,
    }

    return out
}

export function createDummySigningMiddleware(): SigningMiddleware {

    return new SigningMiddleware(dummySign, dummyCheck)



}