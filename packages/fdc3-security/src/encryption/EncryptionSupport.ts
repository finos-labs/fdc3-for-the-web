import { ContextMetadata, Context, PrivateChannel } from "@finos/fdc3"
import { SymmetricKeyResponseContext } from "./SymmetricKeyContext"
import { base64ToArrayBuffer } from "../ClientSideImplementation"

export type Encrypt = (msg: Context, symmetricKey: CryptoKey) => Promise<EncryptedContext>
export type Decrypt = (msg: EncryptedContext, symmetricKey: CryptoKey) => Promise<Context>

export type WrapKey = (toWrap: CryptoKey, publicKeyUrl: string) => Promise<SymmetricKeyResponseContext>
export type UnwrapKey = (key: SymmetricKeyResponseContext) => Promise<CryptoKey | null>

/**
 * This is the field that is added to the context object to contain the encrypted content
 */
export const ENCRYPTION_KEY = "__encrypted"

export enum EncryptionStatus { "cantDecrypt", "notEncrypted", "decrypted" }

export const ENCRYPTION_STATUS = "encryption"

export type EncryptedContent = {
    encoded: string,
    algorithm: any
}

export const SYMMETRIC_ENCRYPTION_ALGORITHM = "AES-GCM"

export type EncryptedContext = {
    type: string,
    __encrypted: EncryptedContent
}

export type ContextMetadataWithEncryptionStatus = ContextMetadata & {
    encryption?: EncryptionStatus
}

export async function createSymmetricKey() {
    const k = await crypto.subtle.generateKey(SYMMETRIC_KEY_PARAMS, true, ["encrypt", "decrypt"]) as CryptoKey
    return k
}

export const SYMMETRIC_KEY_PARAMS: AesKeyGenParams = {
    name: SYMMETRIC_ENCRYPTION_ALGORITHM,
    length: 256
}

export const encrypt: Encrypt = async (c: Context, key: CryptoKey) => {
    const msg = JSON.stringify(c)
    console.log("ENCRYPTING " + msg)

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const details = { name: SYMMETRIC_ENCRYPTION_ALGORITHM, iv }
    const buffer = await crypto.subtle.encrypt(details, key, new TextEncoder().encode(msg))
    const encoded = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    return {
        type: c.type,
        __encrypted: {
            algorithm: details,
            encoded
        }
    }
}

export const decrypt: Decrypt = async (e: EncryptedContext, key: CryptoKey) => {
    const encrypted = e.__encrypted
    console.log("DECRYPTING " + encrypted)
    const details = { name: SYMMETRIC_ENCRYPTION_ALGORITHM, iv: encrypted.algorithm.iv }
    const buffer = await crypto.subtle.decrypt(details, key, base64ToArrayBuffer(encrypted.encoded))
    const decrypted = new TextDecoder().decode(buffer)
    return JSON.parse(decrypted)
}

export interface EncryptingPrivateChannel extends PrivateChannel {

    /**
     * Returns true if this channel is set to encrypt with setChannelEncryption(true)
     */
    isEncrypting(): boolean

    /**
     * Call this method after creation to ensure that further communications on 
     * the channel are encrypted.  
     */
    setChannelEncryption(state: boolean): Promise<void>

    /**
     * Broadcasts the channel's symmetric key, wrapped in the provided public key of 
     * a receiving app.
     */
    broadcastKey(publicKeyUrl: string): Promise<void>

}


export const WRAPPING_ALGORITHM = "RSA-OAEP"

export const WRAPPING_ALGORITHM_KEY_PARAMS: RsaHashedKeyGenParams = {
    name: WRAPPING_ALGORITHM,
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
}

export const WRAPPING_ALGORITHM_DETAILS: RsaOaepParams = {
    name: WRAPPING_ALGORITHM
}

