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
    .then(fdc3 => {

        const csi = new ClientSideImplementation()

        return new SecuredDesktopAgent(fdc3,
            csi.initSigner(signingPrivateKey as CryptoKey, "/sp1-public-key"),
            csi.initChecker(resolver),
            csi.initWrapKey(resolver),
            csi.initUnwrapKey(unwrappingPrivateKey as CryptoKey, "/sp1-public-key"))

    }).then(async fdc3 => {
        console.log("in promise")

        fdc3.addIntentListener("SecretComms", async (context) => {
            const pc = await fdc3.createPrivateChannel()
            const msg = document.createElement("p");
            msg.textContent = "Created private channel!: " + JSON.stringify(pc);
            const log = document.getElementById("log");
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
