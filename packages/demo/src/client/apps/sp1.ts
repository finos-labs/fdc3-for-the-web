import { Context, DesktopAgent } from '@finos/fdc3'
import { getClientAPI } from '@kite9/client'
import { SecuredDesktopAgent, Resolver, SIGNING_ALGORITHM_DETAILS, WRAPPING_ALGORITHM_KEY_PARAMS, ClientSideImplementation } from '@kite9/fdc3-security'


let signingPrivateKey: CryptoKey | null = null
let unwrappingPrivateKey: CryptoKey | null = null

const resolver: Resolver = (u: string) => {
    return fetch(u)
        .then(r => r.json())
}

async function setupKeys(j: JsonWebKey[]): Promise<DesktopAgent> {
    signingPrivateKey = await crypto.subtle.importKey("jwk", j[0], SIGNING_ALGORITHM_DETAILS, true, ["sign"])
    unwrappingPrivateKey = await crypto.subtle.importKey("jwk", j[1], WRAPPING_ALGORITHM_KEY_PARAMS, true, ["unwrapKey"])
    return getClientAPI()
}

fetch('/sp1-private-key')
    .then(r => r.json())
    .then(j => setupKeys(j))
    .then(c => {

        const csi = new ClientSideImplementation()

        return new SecuredDesktopAgent(c,
            csi.initSigner(signingPrivateKey as CryptoKey, "/sp1-public-key"),
            csi.initChecker(resolver),
            csi.initWrapKey(resolver),
            csi.initUnwrapKey(unwrappingPrivateKey as CryptoKey, "/sp1-public-key"))

    }).then(async efdc3 => {
        console.log("in promise")

        efdc3.addIntentListener("SecretComms", async (context, metadata) => {
            const log = document.getElementById("log");
            const msg1 = document.createElement("pre");
            msg1.textContent = `Received: ${JSON.stringify(context)} and meta ${JSON.stringify(metadata)}`
            log?.appendChild(msg1)
            const msg = document.createElement("pre");
            const pc = await efdc3.createPrivateChannel()
            msg.textContent = "Created private channel!: " + JSON.stringify(pc);
            log?.appendChild(msg);

            var broadcastCount = 0;

            setInterval(() => {
                broadcastCount++
                const outContext = {
                    type: 'demo.counter',
                    id: {
                        bc: broadcastCount
                    },
                    original: context
                } as Context
                pc.broadcast(outContext)
            }, 1000);

            return pc
        })
    });
