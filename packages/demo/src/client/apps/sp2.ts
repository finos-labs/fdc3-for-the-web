import { PrivateChannel } from '@finos/fdc3';
import { getClientAPI } from 'client'
import { Options } from 'fdc3-common';
import { ClientSideImplementation, Resolver, SIGNING_ALGORITHM_DETAILS, SigningMiddleware } from 'fdc3-security';



/**
 * Gets the private channel via a raise Intent then spools the output
 */
function doIt() {
    fetch('/sp2-private-key')
        .then(r => r.json())
        .then(j => {
            return crypto.subtle.importKey("jwk", j, SIGNING_ALGORITHM_DETAILS, true, ["sign"])
        }).then(privateKey => {
            const csi = new ClientSideImplementation()

            const resolver: Resolver = (u) => {
                return fetch(u)
                    .then(r => r.json())
            }

            const signingMiddleware = new SigningMiddleware(
                csi.initSigner(privateKey, "/sp2-public-key"),
                csi.initChecker(resolver))

            const OPTIONS: Options = {
                middlewares: [signingMiddleware]
            }

            return getClientAPI(OPTIONS)
        }).then(async fdc3 => {
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
