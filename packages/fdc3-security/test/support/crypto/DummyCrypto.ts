import { Check, MessageSignature, Sign, SigningMiddleware } from "../../../src/SigningMiddleware";



const dummySign: Sign = async (msg: string) => {
    const out = {
        digest: "length: " + msg.length,
        certificateUrl: "https://dummy.com/cert",
        algorithm: "LENGTH-CHECK"
    } as MessageSignature
    return out;
}

const dummyCheck: Check = async (p: MessageSignature, msg: string) => {
    const out = {
        valid: p.digest == ("length: " + msg.length),
        verified: true,
        certificateUrl: p.certificateUrl,
        x509: "zoblidob"
    }

    return out
}

export function createDummySigningMiddleware(): SigningMiddleware {

    return new SigningMiddleware(dummySign, dummyCheck)



}