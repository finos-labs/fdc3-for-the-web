import { Context, ContextHandler, Listener, PrivateChannel } from "@finos/fdc3"
import { ContextMetadataWithEncryptionStatus, ENCRYPTION_KEY, ENCRYPTION_STATUS, EncryptingPrivateChannel, EncryptionStatus, UnwrapKey, WrapKey, createSymmetricKey, decrypt, encrypt } from "./EncryptionSupport"
import { ChannelDelegate } from "../delegates/ChannelDelegate"
import { SYMMETRIC_KEY_RESPONSE_CONTEXT, SYMMETRIC_KEY_REQUEST_CONTEXT, SymmetricKeyResponseContext, SymmetricKeyRequestContext } from "./SymmetricKeyContext"
import { ContextMetadataWithAuthenticity } from "../signing/SigningSupport"

/**
 * Adds encryptiion support for private channels.  A wrapped, symmetric key is sent via the private channel, 
 * and the unwrapKey method is used to unwrap it, allowing further decoding of messages.
 * 
 * Some considerations:
 * 
 * 1.  A symmetric key is only created once for the channel, and is not changeable after that
 * 2.  Whomever calls setChannelEncryption(true) creates the symmetric key and is the keyCreator.
 * 3.  Users of the channel will request an encryption key if they can't decrypt messages.
 * 4.  We need a flow-chart for this.
 */
export class EncryptingChannelDelegate extends ChannelDelegate implements EncryptingPrivateChannel {

    private symmetricKey: CryptoKey | null = null
    private encrypting: boolean = false
    private wrapKey: WrapKey
    private keyCreator: boolean = false

    requestListener: Listener | null = null
    responseListener: Listener | null = null

    constructor(d: PrivateChannel, unwrapKey: UnwrapKey, wrapKey: WrapKey) {
        super(d)
        this.wrapKey = wrapKey

        // listen for a symmetric key being sent
        super.addContextListener(SYMMETRIC_KEY_RESPONSE_CONTEXT, async (context: SymmetricKeyResponseContext, _meta: any) => {
            const newKey = await unwrapKey(context)
            if (newKey) {
                if (this.symmetricKey == null) {
                    this.symmetricKey = newKey
                } else {
                    // this is an error - key can't be changed after being created
                }
            }
        }).then(l => {
            this.responseListener = l
        })
    }

    isEncrypting(): boolean {
        return this.symmetricKey != null
    }

    async setChannelEncryption(state: boolean): Promise<void> {
        this.encrypting = state
        if (state && !this.symmetricKey) {
            this.symmetricKey = await createSymmetricKey()
            this.keyCreator = true

            if (!this.requestListener) {
                // respond to requests for symmetric keys
                this.requestListener = await super.addContextListener(SYMMETRIC_KEY_REQUEST_CONTEXT, async (_context: SymmetricKeyRequestContext, meta: ContextMetadataWithAuthenticity | undefined) => {
                    console.log(`Received key request ${meta}`)
                    if ((meta?.authenticity?.verified) && (meta?.authenticity?.valid)) {
                        this.broadcastKey(meta.authenticity.publicKeyUrl)
                    }
                })
            }
        }
    }

    async broadcastKey(publicKeyUrl: string): Promise<void> {
        if (this.symmetricKey) {
            const ctx = await this.wrapKey(this.symmetricKey, publicKeyUrl)
            await super.broadcast(ctx)
            return
        } else {
            throw new Error("Channel not set to encrypting")
        }
    }

    async requestEncryptionKey(): Promise<void> {
        const request = {
            type: SYMMETRIC_KEY_REQUEST_CONTEXT
        } as SymmetricKeyRequestContext
        return this.broadcast(request)
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
                    if (!this.keyCreator) {
                        this.requestEncryptionKey()
                    }
                }
            } else {
                newMeta[ENCRYPTION_STATUS] = EncryptionStatus.notEncrypted
            }

            return ch(context, newMeta)
        }

        return out as ContextHandler
    }
}