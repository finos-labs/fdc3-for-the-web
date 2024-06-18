import { DesktopAgent, PrivateChannel } from '@finos/fdc3';
import { getClientAPI } from '@kite9/client'
import { SecuredDesktopAgent, Resolver, SIGNING_ALGORITHM_DETAILS, ClientSideImplementation, WRAPPING_ALGORITHM_KEY_PARAMS } from '@kite9/fdc3-security'


let signingPrivateKey: CryptoKey | null = null
let unwrappingPrivateKey: CryptoKey | null = null
let privateChannel: PrivateChannel | null = null
/**
 * Gets the private channel via a raise Intent then spools the output
 */
function doIt() {


    const resolver: Resolver = (u: string) => {
        return fetch(u)
            .then(r => r.json())
    }

    async function setupKeys(j: JsonWebKey[]): Promise<DesktopAgent> {
        signingPrivateKey = await crypto.subtle.importKey("jwk", j[0], SIGNING_ALGORITHM_DETAILS, true, ["sign"])
        unwrappingPrivateKey = await crypto.subtle.importKey("jwk", j[1], WRAPPING_ALGORITHM_KEY_PARAMS, true, ["unwrapKey"])
        return getClientAPI()
    }

    fetch('/sp2-private-key')
        .then(r => r.json())
        .then(j => setupKeys(j))
        .then(c => {
            const csi = new ClientSideImplementation()

            return new SecuredDesktopAgent(c,
                csi.initSigner(signingPrivateKey as CryptoKey, "/sp2-public-key"),
                csi.initChecker(resolver),
                csi.initWrapKey(resolver),
                csi.initUnwrapKey(unwrappingPrivateKey as CryptoKey, "/sp2-public-key"))

        }).then(async sfdc3 => {
            console.log("in promise")
            console.log("in promise")
            const log = document.getElementById("log");
            const reso = await sfdc3.raiseIntent("SecretComms", {
                type: "fdc3.instrument",
                id: {
                    isin: "Abc123"
                }
            })

            log!!.textContent = `Got resolution: ${reso.intent} from ${reso.source}\n`
            const result = await reso.getResult()
            log!!.textContent += `Got result: ${result?.type} ${result?.id}\n`

            privateChannel = result as PrivateChannel
            privateChannel.addContextListener(null, (ctx, meta) => {
                log!!.textContent += `Private Channel Message ctx=${JSON.stringify(ctx)} meta=${JSON.stringify(meta)} \n`;
            })

        });
}

window.addEventListener("load", () => {
    const broadcast = document.getElementById("raise");
    broadcast?.addEventListener("click", () => doIt());
})
