import { Context, ContextHandler, Listener, PrivateChannel } from "@finos/fdc3"
import { ContextMetadataWithEncryptionStatus, ENCRYPTION_KEY, ENCRYPTION_STATUS, EncryptingPrivateChannel, EncryptionStatus, UnwrapKey, WrapKey, createSymmetricKey, decrypt, encrypt } from "./EncryptionSupport"
import { ChannelDelegate } from "../delegates/ChannelDelegate"
import { SYMMETRIC_KEY_CONTEXT, SymmetricKeyContext } from "./SymmetricKeyContext"

/**
 * Adds encryptiion support for private channels.  A wrapped, symmetric key is sent via the private channel, 
 * and the unwrapKey method is used to unwrap it, allowing further decoding of messages.
 */
export class EncryptingChannelDelegate extends ChannelDelegate implements EncryptingPrivateChannel {

    private symmetricKey: CryptoKey | null = null
    private wrapKey: WrapKey
    private encrypting = false

    constructor(d: PrivateChannel, unwrapKey: UnwrapKey, wrapKey: WrapKey) {
        super(d)
        this.wrapKey = wrapKey
        super.addContextListener(SYMMETRIC_KEY_CONTEXT, async (context: SymmetricKeyContext, _meta: any) => {
            const newKey = await unwrapKey(context)
            if (newKey) {
                this.symmetricKey = newKey
            }
        })
    }

    async setChannelEncryption(state: boolean): Promise<void> {
        if (state && !this.symmetricKey) {
            this.symmetricKey = await createSymmetricKey()
        }
        this.encrypting = state
    }

    async broadcastKey(key: CryptoKey, publicKeyUrl: string): Promise<void> {
        if (this.symmetricKey) {
            const ctx = await this.wrapKey(this.symmetricKey, key, publicKeyUrl)
            return super.broadcast(ctx)
        } else {
            throw new Error("Channel not set to encrypting")
        }
    }

    async encryptIfAvailable(context: Context): Promise<Context> {
        return (this.symmetricKey && this.encrypting) ? await encrypt(context, this.symmetricKey) : context
    }

    broadcast(context: Context): Promise<void> {
        return this.encryptIfAvailable(context).then(ec => super.broadcast(ec))
    }

    addContextListener(context: any, handler?: any): Promise<Listener> {
        const theHandler: ContextHandler = handler ? handler : (context as ContextHandler)
        const theContextType: string | null = context && handler ? (context as string) : null
        return super.addContextListener(theContextType, this.decryptingContextHandler(theHandler))
    }

    decryptingContextHandler(ch: ContextHandler): ContextHandler {
        const out = async (context: Context, meta: ContextMetadataWithEncryptionStatus) => {
            const newMeta: ContextMetadataWithEncryptionStatus = {
                ...meta
            }

            delete newMeta[ENCRYPTION_STATUS]

            const encrypted = context[ENCRYPTION_KEY]

            if (encrypted) {
                if (this.symmetricKey) {
                    context = await decrypt(encrypted, this.symmetricKey)
                    newMeta[ENCRYPTION_STATUS] = EncryptionStatus.decrypted
                } else {
                    newMeta[ENCRYPTION_STATUS] = EncryptionStatus.cantDecrypt
                }
            } else {
                newMeta[ENCRYPTION_STATUS] = EncryptionStatus.notEncrypted
            }

            return ch(context, newMeta)
        }

        return out as ContextHandler
    }
}