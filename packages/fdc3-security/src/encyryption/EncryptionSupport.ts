import { Context } from "vm"

export type Encrypt = (msg: Context) => Promise<EncryptedContext>
export type Decrypt = (msg: EncryptedContext) => Promise<Context>

/**
 * This is the field that is added to the context object to contain the encrypted content
 */
export const ENCRYPTION_KEY = "__encrypted"

export type EncryptedContent = {
    encrypted: string,
    algorithm: any
}

export const ENCRYPTION_ALGORITHM = "AES-GCM"

export type EncryptedContext = {
    type: string,
    __encrypted: EncryptedContent
}