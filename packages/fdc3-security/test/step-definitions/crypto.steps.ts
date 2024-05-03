import { Given } from "@cucumber/cucumber";
import { CustomWorld } from "../world";
import { ClientSideImplementation } from "../../src/ClientSideImplementation";



Given('A New Keypair loaded into {string} and {string}', async function (this: CustomWorld, pub: string, priv: string) {
    const params: RsaHashedKeyGenParams = {
        hash: 'SHA-512',
        name: 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01])
    }

    const kp = await crypto.subtle.generateKey(params, true, ["sign", "verify"]) as CryptoKeyPair
    this.props[pub] = kp.publicKey
    this.props[priv] = kp.privateKey
});

Given('A Client Side Implementation in {string}', function (this: CustomWorld, field: string) {
    this.props[field] = new ClientSideImplementation()
})