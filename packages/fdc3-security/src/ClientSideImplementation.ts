import { Context } from "vm";
import { Decrypt, ENCRYPTION_ALGORITHM, Encrypt, EncryptedContent, EncryptedContext } from "./encyryption/EncryptionSupport";
import { Check, MessageAuthenticity, MessageSignature, Sign, SIGNING_ALGORITHM_DETAILS } from "./signing/SigningSupport";

/**
 * When given the URL of a public key to load, this function 
 * resolves that URL into a JsonWebKey object that can be turned into 
 * a Public Crypto key with the SIGNING_ALGORITHM_DETAILS.
 */
export type Resolver = (url: string) => Promise<JsonWebKey>

function base64ToArrayBuffer(base64: string) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export class ClientSideImplementation {

    initSigner(privateKey: CryptoKey, publicKeyUrl: string): Sign {
        return async (msg: string, date: Date) => {
            const buffer = await crypto.subtle.sign(SIGNING_ALGORITHM_DETAILS, privateKey, new TextEncoder().encode(msg))
            const digest = btoa(String.fromCharCode(...new Uint8Array(buffer)));

            return {
                algorithm: SIGNING_ALGORITHM_DETAILS,
                publicKeyUrl,
                digest,
                date: date.toISOString()
            } as MessageSignature
        }
    }

    initEncrypt(key: CryptoKey): Encrypt {
        return async (c: Context) => {
            const msg = JSON.stringify(c)
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const details = { name: ENCRYPTION_ALGORITHM, iv }
            const buffer = await crypto.subtle.encrypt(details, key, new TextEncoder().encode(msg))
            const encrypted = btoa(String.fromCharCode(...new Uint8Array(buffer)));

            return {
                type: c.type,
                __encrypted: {
                    algorithm: details,
                    encrypted
                }
            }
        }
    }

    initDecrypt(key: CryptoKey): Decrypt {
        return async (e: EncryptedContext) => {
            const encrypted = e.__encrypted
            const details = { name: ENCRYPTION_ALGORITHM, iv: encrypted.algorithm.iv }
            const buffer = await crypto.subtle.decrypt(details, key, base64ToArrayBuffer(encrypted.encrypted))
            const decrypted = new TextDecoder().decode(buffer)
            return JSON.parse(decrypted)
        }
    }

    async wrapKey(toWrap: CryptoKey, wrapWith: CryptoKey): Promise<EncryptedContent> {
        const params: RsaOaepParams = {
            name: "RSA-OAEP"
        }
        const buffer = await crypto.subtle.wrapKey("jwk", toWrap, wrapWith, params)
        const encrypted = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        return {
            algorithm: params,
            encrypted
        }
    }

    async unwrapKey(c: EncryptedContent, unwrapWith: CryptoKey): Promise<CryptoKey> {
        const key = await crypto.subtle.unwrapKey("jwk", base64ToArrayBuffer(c.encrypted), unwrapWith, "RSA-OAEP", ENCRYPTION_ALGORITHM, true, ["encrypt", "decrypt"])
        return key
    }

    validateAlgorithm(algorithm: any) {
        if ((algorithm.name != SIGNING_ALGORITHM_DETAILS.name) || (algorithm.hash != SIGNING_ALGORITHM_DETAILS.hash)) {
            throw new Error("Unsupported Algorithm")
        }
    }

    initChecker(resolver: Resolver, timeWindowMS: number = 2000): Check {
        return async (p: MessageSignature, msg: string): Promise<MessageAuthenticity> => {
            this.validateAlgorithm(p.algorithm)
            const jsonWebKey = await resolver(p.publicKeyUrl)
            const publicKey = await crypto.subtle.importKey("jwk", jsonWebKey, SIGNING_ALGORITHM_DETAILS, true, ["verify"])
            const validated = await crypto.subtle.verify(p.algorithm, publicKey, base64ToArrayBuffer(p.digest), new TextEncoder().encode(msg))
            const timeNow = new Date()
            const messageTime = new Date(p.date)
            const timeOk = (timeNow.getTime() - messageTime.getTime()) < timeWindowMS

            return {
                verified: true,
                valid: validated && timeOk,
                publicKeyUrl: p.publicKeyUrl,
            }
        }
    }
}
