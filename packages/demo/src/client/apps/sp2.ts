import { PrivateChannel } from '@finos/fdc3';
import { getClientAPI } from 'client'
import { Options } from 'fdc3-common';
import { SigningDesktopAgent, Resolver, SIGNING_ALGORITHM_DETAILS, ClientSideImplementation } from 'fdc3-security'



/**
 * Gets the private channel via a raise Intent then spools the output
 */
function doIt() {

    let pk: CryptoKey | null = null

    const resolver: Resolver = (u: string) => {
        return fetch(u)
            .then(r => r.json())
    }

    fetch('/sp2-private-key')
        .then(r => r.json())
        .then(j => {
            return crypto.subtle.importKey("jwk", j, SIGNING_ALGORITHM_DETAILS, true, ["sign"])
        }).then(privateKey => {
            pk = privateKey

            return getClientAPI()
        }).then(fdc3 => {

            const csi = new ClientSideImplementation()

            return new SigningDesktopAgent(fdc3,
                csi.initSigner(pk, "/sp1-public-key"),
                csi.initChecker(resolver))

        }).then(async fdc3 => {
            console.log("in promise")
            console.log("in promise")
            const log = document.getElementById("log");
            const reso = await fdc3.raiseIntent("SecretComms", {
                type: "fdc3.instrument",
                id: {
                    isin: "Abc123"
                }
            })

            log!!.textContent = `Got resolution: ${JSON.stringify(reso)}`
            const result = await reso.getResult()
            log!!.textContent += `Got result: ${JSON.stringify(result)}`

            const privateChannel = result as PrivateChannel
            privateChannel.addContextListener(null, (ctx, meta) => {
                log!!.textContent += `Private Channel Message ctx=${JSON.stringify(ctx)} meta=${JSON.stringify(meta)} \n`;
            })

        });
}

window.addEventListener("load", () => {
    const broadcast = document.getElementById("raise");
    broadcast?.addEventListener("click", () => doIt());
})
