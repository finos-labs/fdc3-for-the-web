import { Check, MessageAuthenticity, MessageSignature, Sign } from "./SigningMiddleware"


export const SIGNING_ALGORITHM_DETAILS = {
    name: "ECDSA",
    hash: { name: "SHA-512" }
} as EcdsaParams


export class ClientSideImplementation {

    initSigner(privateKey: CryptoKey, certificateUrl?: string): Sign {
        return async (msg: string) => {
            const buffer = await crypto.subtle.sign(SIGNING_ALGORITHM_DETAILS, privateKey, new TextEncoder().encode(msg))
            const digest = btoa(String.fromCharCode(...new Uint8Array(buffer)));

            return {
                algorithm: SIGNING_ALGORITHM_DETAILS,
                certificateUrl,
                digest
            } as MessageSignature
        }
    }

    validateAlgorithm(algorithm: any) {
        if ((algorithm.name != SIGNING_ALGORITHM_DETAILS.name) || (algorithm.hash != SIGNING_ALGORITHM_DETAILS.hash)) {
            throw new Error("Unsupported Algorithm")
        }
    }

    initChecker(publicKey: CryptoKey): Check {
        return async (p: MessageSignature, msg: string): Promise<MessageAuthenticity> => {

            function base64ToArrayBuffer(base64: string) {
                var binaryString = atob(base64);
                var bytes = new Uint8Array(binaryString.length);
                for (var i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes.buffer;
            }

            const validated = await crypto.subtle.verify(p.algorithm, publicKey, base64ToArrayBuffer(p.digest), new TextEncoder().encode(msg))
            return {
                verified: true,
                valid: validated,
                certificateUrl: "dunno",
                x509: "hi"
            }
        }
    }
}
