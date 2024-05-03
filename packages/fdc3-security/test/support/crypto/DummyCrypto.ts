import { Check, MessageSignature, Sign, SigningMiddleware } from "../../../src/SigningMiddleware";



const dummySign: Sign = async (msg: string) => {
    return "length: " + msg.length
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

export function createDummySigningMiddleware(cert: string): SigningMiddleware {

    return new SigningMiddleware(dummySign, dummyCheck, cert)



}