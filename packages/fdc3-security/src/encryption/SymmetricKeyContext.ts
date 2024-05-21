import { Context } from "@finos/fdc3"

export const SYMMETRIC_KEY_CONTEXT = 'fdc3.security.symmetricKey'

export type SymmetricKeyContext = Context & {
    type: 'fdc3.security.symmetricKey',
    id: {
        publicKeyUrl: string
    }
    wrappedKey: string,
    algorithm: any
}