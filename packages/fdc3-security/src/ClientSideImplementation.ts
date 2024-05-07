import { Check, MessageAuthenticity, MessageSignature, Sign } from "./SigningMiddleware"


export const SIGNING_ALGORITHM_DETAILS = {
    name: "ECDSA",
    hash: "SHA-512",
    namedCurve: 'P-521'
} as EcdsaParams

/**
 * When given the URL of a public key to load, this function 
 * resolves that URL into a JsonWebKey object that can be turned into 
 * a Public Crypto key with the SIGNING_ALGORITHM_DETAILS.
 */
export type Resolver = (url: string) => Promise<JsonWebKey>

export class ClientSideImplementation {

    initSigner(privateKey: CryptoKey, publicKeyUrl: string): Sign {
        return async (msg: string) => {
            const buffer = await crypto.subtle.sign(SIGNING_ALGORITHM_DETAILS, privateKey, new TextEncoder().encode(msg))
            const digest = btoa(String.fromCharCode(...new Uint8Array(buffer)));

            return {
                algorithm: SIGNING_ALGORITHM_DETAILS,
                publicKeyUrl,
                digest
            } as MessageSignature
        }
    }

    validateAlgorithm(algorithm: any) {
        if ((algorithm.name != SIGNING_ALGORITHM_DETAILS.name) || (algorithm.hash != SIGNING_ALGORITHM_DETAILS.hash)) {
            throw new Error("Unsupported Algorithm")
        }
    }

    initChecker(resolver: Resolver): Check {
        return async (p: MessageSignature, msg: string): Promise<MessageAuthenticity> => {

            function base64ToArrayBuffer(base64: string) {
                var binaryString = atob(base64);
                var bytes = new Uint8Array(binaryString.length);
                for (var i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes.buffer;
            }

            this.validateAlgorithm(p.algorithm)
            const jsonWebKey = await resolver(p.publicKeyUrl)
            const publicKey = await crypto.subtle.importKey("jwk", jsonWebKey, SIGNING_ALGORITHM_DETAILS, true, ["verify"])
            const validated = await crypto.subtle.verify(p.algorithm, publicKey, base64ToArrayBuffer(p.digest), new TextEncoder().encode(msg))
            return {
                verified: true,
                valid: validated,
                publicKeyUrl: p.publicKeyUrl,
            }
        }
    }
}
