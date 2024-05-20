import { Check, Sign, MessageSignature, MessageAuthenticity } from "../../../src/signing/SigningSupport";



export const dummySign: Sign = async (msg: string, date: Date) => {
    console.log("SIGNING: " + msg)
    const out = {
        digest: "length: " + msg.length,
        publicKeyUrl: "https://dummy.com/pubKey",
        algorithm: "LENGTH-CHECK",
        date
    } as MessageSignature
    return out;
}

export const dummyCheck: Check = async (p: MessageSignature, msg: string) => {
    console.log("CHECKING: " + msg)
    const out = {
        valid: p.digest == ("length: " + msg.length),
        verified: true,
        publicKeyUrl: p.publicKeyUrl,
    } as MessageAuthenticity

    return out
}