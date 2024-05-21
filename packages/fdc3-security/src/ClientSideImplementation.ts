import { Decrypt, ENCRYPTION_ALGORITHM, Encrypt, UnwrapKey, WrapKey, decrypt, encrypt } from "./encryption/EncryptionSupport";
import { Check, MessageAuthenticity, MessageSignature, Sign, SIGNING_ALGORITHM_DETAILS } from "./signing/SigningSupport";
import { SymmetricKeyContext } from "./encryption/SymmetricKeyContext";

/**
 * When given the URL of a public key to load, this function 
 * resolves that URL into a JsonWebKey object that can be turned into 
 * a Public Crypto key with the SIGNING_ALGORITHM_DETAILS.
 */
export type Resolver = (url: string) => Promise<JsonWebKey>

export function base64ToArrayBuffer(base64: string) {
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

    initWrapKey(): WrapKey {
        return async (toWrap: CryptoKey, wrapWith: CryptoKey, publicKeyUrl: string) => {
            const params: RsaOaepParams = {
                name: "RSA-OAEP"
            }
            const buffer = await crypto.subtle.wrapKey("jwk", toWrap, wrapWith, params)
            const encrypted = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            return {
                type: "fdc3.security.symmetricKey",
                id: {
                    publicKeyUrl
                },
                algorithm: params,
                wrappedKey: encrypted
            }
        }
    }

    initEncrypt(): Encrypt {
        return encrypt

    }

    initDecrypt(): Decrypt {
        return decrypt
    }

    initUnwrapKey(unwrapWith: CryptoKey, publicKeyUrl: string): UnwrapKey {
        return async (c: SymmetricKeyContext) => {
            if (c.id.publicKeyUrl == publicKeyUrl) {
                const encrypted = c.wrappedKey
                const key = await crypto.subtle.unwrapKey("jwk", base64ToArrayBuffer(encrypted), unwrapWith, "RSA-OAEP", ENCRYPTION_ALGORITHM, true, ["encrypt", "decrypt"])
                return key
            } else {
                return null;
            }
        }
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
