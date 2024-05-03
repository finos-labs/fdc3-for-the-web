import { Check, MessageAuthenticity, MessageSignature, Sign } from "./SigningMiddleware"




export class ClientSideImplementation {

    initSigner(privateKey: CryptoKey, algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams, certificateUrl?: string): Sign {
        return async (msg: string) => {
            this.validateAlgorithm(algorithm)
            const buffer = await crypto.subtle.sign({
                name: 'RSA-PSS',
                hash: 'SHA-512',
                saltLength: 100
            }, privateKey, new TextEncoder().encode(msg))
            const digest = btoa(String.fromCharCode(...new Uint8Array(buffer)));

            return {
                algorithm,
                certificateUrl,
                digest
            } as MessageSignature
        }
    }

    validateAlgorithm(algorithm: unknown): AlgorithmIdentifier | RsaPssParams | EcdsaParams {
        // we moight want to further limit the algorithms available for signing in FDC3...
        return algorithm as AlgorithmIdentifier | RsaPssParams | EcdsaParams
    }

    initChecker(publicKey: CryptoKey): Check {
        return async (p: MessageSignature, msg: string): Promise<MessageAuthenticity> => {
            const validatedAlgorithm = this.validateAlgorithm(p.algorithm)
            const validated = await crypto.subtle.verify(validatedAlgorithm, publicKey, new TextEncoder().encode(p.digest), new TextEncoder().encode(msg))
            return {
                verified: true,
                valid: validated,
                certificateUrl: "dunno",
                x509: "hi"
            }
        }
    }
}
