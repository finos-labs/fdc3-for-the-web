import { Given } from "@cucumber/cucumber";
import { CustomWorld } from "../world";
import { ClientSideImplementation, SIGNING_ALGORITHM_DETAILS } from "../../src/ClientSideImplementation";
import { handleResolve } from "../support/matching";

Given('A New Keypair loaded into {string} and {string}', async function (this: CustomWorld, pub: string, priv: string) {
    const params: EcKeyGenParams = {
        ...SIGNING_ALGORITHM_DETAILS,
        namedCurve: 'P-521'
    }

    const kp = await crypto.subtle.generateKey(params, true, ["sign", "verify"]) as CryptoKeyPair
    this.props[pub] = kp.publicKey
    this.props[priv] = kp.privateKey
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

