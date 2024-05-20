import { Check, Sign, MessageSignature, MessageAuthenticity } from "../../../src/signing/SigningSupport";



export const dummySign: Sign = async (msg: string) => {
    const out = {
        digest: "length: " + msg.length,
        publicKeyUrl: "https://dummy.com/pubKey",
        algorithm: "LENGTH-CHECK"
    } as MessageSignature
    return out;
}

export const dummyCheck: Check = async (p: MessageSignature, msg: string) => {
    const out = {
        valid: p.digest == ("length: " + msg.length),
        verified: true,
        publicKeyUrl: p.publicKeyUrl,
    } as MessageAuthenticity

    return out
}