import { Given } from "@cucumber/cucumber";
import { CustomWorld } from "../world";
import { ClientSideImplementation, SIGNING_ALGORITHM_DETAILS } from "../../src/ClientSideImplementation";

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