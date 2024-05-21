import { Given } from "@cucumber/cucumber";
import { CustomWorld } from "../world";
import { handleResolve } from "../support/matching";
import { ClientSideImplementation } from "../../src/ClientSideImplementation";
import { createSymmetricKey } from "../../src/encryption/EncryptionSupport";
import { SIGNING_ALGORITHM_DETAILS } from "../../src/signing/SigningSupport";

Given('A New Signing Keypair loaded into {string} and {string}', async function (this: CustomWorld, pub: string, priv: string) {
    const params: EcKeyGenParams = {
        ...SIGNING_ALGORITHM_DETAILS,
        namedCurve: 'P-521'
    }

    const kp = await crypto.subtle.generateKey(params, true, ["sign", "verify"]) as CryptoKeyPair
    this.props[pub] = kp.publicKey
    this.props[priv] = kp.privateKey
});


Given('A New Encryption Keypair loaded into {string} and {string}', async function (this: CustomWorld, pub: string, priv: string) {
    const params: RsaHashedKeyGenParams = {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
    }

    const kp = await crypto.subtle.generateKey(params, true, ["encrypt", "decrypt", "wrapKey", "unwrapKey"]) as CryptoKeyPair
    this.props[pub] = kp.publicKey
    this.props[priv] = kp.privateKey
});

Given('A Symmetric key loaded into {string}', async function (this: CustomWorld, pub: string) {
    const k = await createSymmetricKey()
    this.props[pub] = k
});

Given('A Client Side Implementation in {string}', function (this: CustomWorld, field: string) {
    this.props[field] = new ClientSideImplementation()
})

Given('A timestamp in {string}', function (this: CustomWorld, field: string) {
    this.props[field] = new Date()
})

Given('A Local URL Resolver in {string} resolving {string} to {string}', function (this: CustomWorld, field: string, url: string, field2: string) {
    const out = (x: string) => {
        if (x == url) {
            const key: CryptoKey = handleResolve(field2, this)
            const jwk = crypto.subtle.exportKey("jwk", key)
            return new Promise(resolve => resolve(jwk))
        } else {
            throw new Error(`Can't resolve ${x}`)
        }
    }

    this.props[field] = out
});

